import type { Location, Item } from '~/types'

interface ExportData {
  version: number
  exportedAt: string
  locations: Location[]
  items: Item[]
}

export function useDataTransfer() {
  const exporting = ref(false)
  const importing = ref(false)
  const error = ref<string | null>(null)

  // ─── Export ───────────────────────────────────────────────────────────────

  async function exportData(): Promise<void> {
    exporting.value = true
    error.value = null
    try {
      const data = await $fetch<ExportData>('/api/export')

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `storelog-export-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (e) {
      error.value = 'Export fehlgeschlagen.'
      throw e
    } finally {
      exporting.value = false
    }
  }

  // ─── Import ───────────────────────────────────────────────────────────────

  async function importData(file: File): Promise<void> {
    importing.value = true
    error.value = null
    try {
      const text = await file.text()

      let data: ExportData
      try {
        data = JSON.parse(text)
      } catch {
        throw new Error('Ungültige JSON-Datei.')
      }

      if (!Array.isArray(data.locations) || !Array.isArray(data.items)) {
        throw new Error('Ungültiges Export-Format.')
      }

      await $fetch('/api/import', { method: 'POST', body: { locations: data.locations, items: data.items } })
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Import fehlgeschlagen.'
      throw e
    } finally {
      importing.value = false
    }
  }

  // ─── File picker helper ───────────────────────────────────────────────────

  function pickFile(): Promise<File> {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'application/json'
      input.onchange = () => {
        const file = input.files?.[0]
        if (file) resolve(file)
        else reject(new Error('Keine Datei ausgewählt.'))
      }
      input.click()
    })
  }

  return {
    exporting,
    importing,
    error,
    exportData,
    importData,
    pickFile,
  }
}
