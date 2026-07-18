import { perPageLimit } from '~/const/utils'
import { useCitizenData } from './citizen/useCitizenData'
import { useCitizenForm, CitizenFormSchema } from './citizen/useCitizenForm'
import { useCitizenExcel } from './citizen/useCitizenExcel'

export { CitizenFormSchema }
export type { CitizenFormSchema as CitizenFormSchemaType } from './citizen/useCitizenForm'

const ageGroupOptions = [
  { key: null, label: 'Semua Usia' },
  { key: '0-5', label: '0 - 5 Tahun' },
  { key: '6-12', label: '6 - 12 Tahun' },
  { key: '13-16', label: '13 - 16 Tahun' },
  { key: '17-21', label: '17 - 21 Tahun' },
  { key: '22-40', label: '22 - 40 Tahun' },
  { key: '41-59', label: '41 - 59 Tahun' },
  { key: '60', label: '>= 60 Tahun' }
]

const columnsFamilyTable = [
  { accessorKey: 'name', header: 'Informasi Warga' },
  { accessorKey: 'username', header: 'Username' },
  { accessorKey: 'ttl', header: 'Tempat, Tgl Lahir' },
  { accessorKey: 'gender', header: 'L/P' },
  { accessorKey: 'blood_type', header: 'Gol. Darah', class: 'text-center' },
  { accessorKey: 'type', header: 'Status' },
  { id: 'action', header: 'Aksi', class: 'text-right' }
]

export const useCitizen = () => {
  const data = useCitizenData()
  const form = useCitizenForm(data.getData)
  const excel = useCitizenExcel(data.getData)

  return {
    // Constants
    columnsFamilyTable,
    ageGroupOptions,
    perPageLimit,
    // From data composable
    ...data,
    // From form composable
    ...form,
    // From excel composable
    ...excel
  }
}
