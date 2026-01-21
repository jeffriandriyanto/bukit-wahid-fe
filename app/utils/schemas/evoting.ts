import { z } from 'zod'

export const Step1Schema = z.object({
  title: z.string().min(1, 'Judul wajib diisi'),
  shown: z.string().min(1, 'Target RT wajib dipilih'),
  date: z.string().min(1, 'Tanggal wajib diisi'),
  time: z.string().min(1, 'Jam wajib diisi'),
  image: z.string().optional()
})

export const Step2Schema = z.object({
  candidate: z.array(
    z.object({
      name: z.string().min(1, 'Nama kandidat wajib diisi'),
      vision: z.string().min(1, 'Visi wajib diisi'),
      poster: z.string().optional()
    })
  ).min(2, 'Minimal harus ada 2 kandidat')
})

export const EVotingFormSchema = Step1Schema.merge(Step2Schema)
export type EVotingForm = z.infer<typeof EVotingFormSchema>
