import type React from 'react'

type EntityDisplayFieldProps =
  | {
      title: string
      value: string
      fieldName?: never
      children?: never
    }
  | {
      title: string
      value: string[]
      fieldName: string
      children?: never
    }
  | {
      title: string
      children: React.ReactNode
      value?: never
      fieldName?: never
    }

const getEntityValue = (value: string, isBadge = false) => {
  return isBadge ? (
    <span className={'inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-xs font-medium'}>{value}</span>
  ) : (
    <p className={'text-sm'}>{value}</p>
  )
}

export const EntityDisplayField = ({
  title,
  value,
  fieldName,
  children,
}: React.PropsWithChildren<EntityDisplayFieldProps>) => {
  // Simple field with children, no processing on it
  if (children) {
    return (
      <div>
        <h4 className='mb-2 text-sm font-medium text-muted-foreground'>{title}</h4>
        {children}
      </div>
    )
  }

  return (
    <div>
      <h4 className='mb-2 text-sm font-medium text-muted-foreground'>{title}</h4>
      {Array.isArray(value) ? (
        <div className={'flex flex-wrap gap-1'}>
          {value.map((v, index) => (
            <div
              key={`${fieldName}_${
                // biome-ignore lint/suspicious/noArrayIndexKey: Ok here
                index
              }`}
            >
              {getEntityValue(v, true)}
            </div>
          ))}
        </div>
      ) : (
        getEntityValue(value || '')
      )}
    </div>
  )
}
