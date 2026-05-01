import React, { useState, useEffect } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@radix-ui/react-popover'
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from 'cmdk'
import { Button } from '../ui/button'
import { cn } from '@/lib/utils'

interface Props {
  items: { value: string; label: string }[]
  value?: string
  onSelect: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  className?: string
}

export default function Combobox({ items, value, onSelect, placeholder = 'Seleccione...', searchPlaceholder = 'Buscar...', emptyText = 'No se encontraron resultados.', className }: Props) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const filtered = search
    ? items.filter(i => i.label.toLowerCase().includes(search.toLowerCase()) || i.value.toLowerCase().includes(search.toLowerCase()))
    : items

  const selected = items.find(i => i.value === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" className={cn('w-full justify-between', className)}>
          {selected?.label || placeholder}
          <span className="ml-2 opacity-50">▼</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput
            placeholder={searchPlaceholder}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {filtered.map(item => (
                <CommandItem
                  key={item.value}
                  onSelect={() => {
                    onSelect(item.value)
                    setOpen(false)
                    setSearch('')
                  }}
                >
                  {item.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
