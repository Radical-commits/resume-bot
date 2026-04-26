export interface Resume {
  personalInfo: PersonalInfo
  summary: string
  highlights: string[]
  skills: Skills
  experience: Experience[]
  education: Education[]
  certifications: Certification[]
  languages: Language[]
  patents?: Patent[]
}

export interface PersonalInfo {
  name: string
  title: string
  tagline?: string
  location: string
  phone: string
  email: string
  linkedin: string
  github: string
  website?: string
}

export interface Skills {
  [category: string]: string[]
}

export interface Experience {
  title: string
  company: string
  location: string
  startDate: string
  endDate: string
  current: boolean
  achievements: string[]
}

export interface Education {
  degree: string
  institution: string
  location: string
  year?: string
}

export interface Certification {
  name: string
  issuer: string
  year?: string
}

export interface Language {
  name: string
  proficiency: string
}

export interface Patent {
  title: string
  number: string
  date: string
}
