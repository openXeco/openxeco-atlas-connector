'use client'

import { Card, CardTitle, CardDescription, CardHeader, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useActionState, useEffect } from 'react'
import { updateGeneralSettings } from '@/app/actions/settings'
import { Label } from '@/components/ui/label'
import useSWR from 'swr'
import type { GeneralSettings, Taxonomy } from '@/types'
import { apiFetcher } from '@/lib/swr'
import { SelectTrigger, SelectValue, SelectContent, SelectItem, Select } from '@/components/ui/select'
import { Message } from '@/components/ui/message'

export const GeneralTab = ({ countries = [] }: { countries: Taxonomy[] }) => {
  const [state, formAction, pending] = useActionState(updateGeneralSettings, null)

  const { data, mutate } = useSWR<{ data: { general: GeneralSettings } }>('/api/settings', apiFetcher)

  const settings = data?.data.general

  useEffect(() => {
    if (state?.success && state.country) {
      mutate(
        {
          data: {
            general: {
              country: state.country,
            },
          },
        },
        false,
      ) // no revalidation
    }
  }, [state, mutate])

  if (!settings) {
    return <>Loading...</>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>General Settings</CardTitle>
        <CardDescription>Configure general application behavior and preferences</CardDescription>
      </CardHeader>
      <CardContent className='space-y-6'>
        <form action={formAction} id={'form-general-settings'}>
          {state?.success !== undefined && (
            <div className={'my-2'}>
              <Message message={state.success ? state.message : state.error} success={state.success} />
            </div>
          )}
          <div className='grid gap-6'>
            <div className='grid gap-2'>
              <Label htmlFor='appName'>NCC country</Label>
              <Select
                name={'country'}
                defaultValue={settings?.country}
                // onValueChange={(value: string) => {
                //   setCountryId(value)
                // }}
              >
                <SelectTrigger id='FORM-ECCC-001-Q102'>
                  <SelectValue placeholder='Select a country' />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country.id} value={country.id}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className='text-sm text-muted-foreground'>
                If set, this field will be used as "country" value for all entities.
              </p>
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter>
        <Button type={'submit'} disabled={pending} form={'form-general-settings'}>
          {pending ? 'Saving...' : 'Save Settings'}
        </Button>
      </CardFooter>
    </Card>
  )
}
