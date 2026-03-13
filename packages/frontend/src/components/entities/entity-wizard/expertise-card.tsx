import { Label } from '@/components/ui/label'
import { MultiSelect } from '@/components/ui/multi-select'
import { Textarea } from '@/components/ui/textarea'
import { CardProps } from '@/components/entities/entity-wizard/types'

export const ExpertiseCard = ({
  useFormParams: {
    watch,
    register,
    formState: { errors },
    setValue,
  },
  fieldsOfActivity,
  thematicAreas,
  sectors,
  technologies,
  useCases,
}: CardProps) => {
  const formData = watch()

  return (
    <>
      <div className="space-y-2" id="FORM-ECCC-001-Q301-container">
        <Label htmlFor="FORM-ECCC-001-Q301">Fields of Activity (Article 8(3)) *</Label>
        <p className="text-sm text-muted-foreground mb-2">
          Your organization&apos;s expertise in the field of cybersecurity according to Article 8(3) of Regulation (EU)
          2021/887.
        </p>
        <MultiSelect
          options={fieldsOfActivity.map((f) => ({ id: f.id, name: f.name }))}
          value={formData.fieldsOfActivityIds || []}
          onChange={(values) => setValue('fieldsOfActivityIds', values)}
          placeholder="Select fields of activity"
        />
        {errors.fieldsOfActivityIds && <p className="text-sm text-destructive">{errors.fieldsOfActivityIds.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="FORM-ECCC-001-Q302">Expertise - detailed description *</Label>
        <Textarea
          id="FORM-ECCC-001-Q302"
          {...register('expertiseDescription')}
          placeholder="Describe your expertise (max 800 characters)"
          rows={4}
          maxLength={800}
        />
        <p className="text-xs text-muted-foreground">{formData.expertiseDescription?.length || 0}/800 characters</p>
        {errors.expertiseDescription && (
          <p className="text-sm text-destructive">{errors.expertiseDescription.message}</p>
        )}
      </div>

      <div className="space-y-2" id="FORM-ECCC-001-Q303-1-container">
        <Label htmlFor="FORM-ECCC-001-Q303-1">
          Expertise according to the Cybersecurity Taxonomy (Knowledge Domains)
        </Label>
        <MultiSelect
          options={thematicAreas.map((t) => ({
            id: t.id,
            name: t.name,
            parentId: t.parentId,
            atlasId: t.atlasId,
          }))}
          value={formData.thematicAreaIds || []}
          onChange={(values) => setValue('thematicAreaIds', values)}
          placeholder="Select knowledge domains"
          hierarchical
        />
      </div>

      <div className="space-y-2" id="FORM-ECCC-001-Q303-3-container">
        <Label htmlFor="FORM-ECCC-001-Q303-3">Sectors according to the Cybersecurity Taxonomy</Label>
        <MultiSelect
          options={sectors.map((s) => ({ id: s.id, name: s.name }))}
          value={formData.sectorIds || []}
          onChange={(values) => setValue('sectorIds', values)}
          placeholder="Select sectors"
        />
      </div>

      <div className="space-y-2" id="FORM-ECCC-001-Q303-5-container">
        <Label htmlFor="FORM-ECCC-001-Q303-5">Technologies according to the Cybersecurity Taxonomy</Label>
        <MultiSelect
          options={technologies.map((t) => ({ id: t.id, name: t.name }))}
          value={formData.technologyIds || []}
          onChange={(values) => setValue('technologyIds', values)}
          placeholder="Select technologies"
        />
      </div>

      <div className="space-y-2" id="FORM-ECCC-001-Q303-7-container">
        <Label htmlFor="FORM-ECCC-001-Q303-7">Use cases according to the Cybersecurity Taxonomy</Label>
        <MultiSelect
          options={useCases.map((u) => ({ id: u.id, name: u.name }))}
          value={formData.useCaseIds || []}
          onChange={(values) => setValue('useCaseIds', values)}
          placeholder="Select use cases"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="FORM-ECCC-001-Q303-2">What do you seek to achieve by joining the community?</Label>
        <Textarea id="FORM-ECCC-001-Q303-2" {...register('goalsToAchieve')} placeholder="Goals to achieve" rows={3} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="FORM-ECCC-001-Q305">
          How and in which goals and tasks of the community can you contribute?
        </Label>
        <Textarea
          id="FORM-ECCC-001-Q305"
          {...register('goalsToContribute')}
          placeholder="Goals to contribute"
          rows={3}
        />
      </div>
    </>
  )
}
