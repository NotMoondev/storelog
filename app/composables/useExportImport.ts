import type { Location, Item } from '~/types'
import { useDB } from '~/repositories/db'

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
      const db = useDB()
      const data: ExportData = {
        version: 1,
        exportedAt: new Date().toISOString(),
        locations: await db.locations.toArray(),
        items: await db.items.toArray(),
      }

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

      const db = useDB()
      await db.transaction('rw', [db.locations, db.items], async () => {
        await db.locations.clear()
        await db.items.clear()
        if (data.locations.length) await db.locations.bulkAdd(data.locations)
        if (data.items.length) await db.items.bulkAdd(data.items)
      })
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