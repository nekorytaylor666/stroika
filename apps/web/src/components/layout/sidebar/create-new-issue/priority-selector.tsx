'use client';

import { Button } from '@/components/ui/button';
import {
   Command,
   CommandEmpty,
   CommandGroup,
   CommandInput,
   CommandItem,
   CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useConstructionData } from '@/hooks/use-construction-data';
import { CheckIcon } from 'lucide-react';
import { useEffect, useId, useState } from 'react';

interface PrioritySelectorProps {
   priority: any | null;
   onChange: (priority: any | null) => void;
}

export function PrioritySelector({ priority, onChange }: PrioritySelectorProps) {
   const id = useId();
   const [open, setOpen] = useState<boolean>(false);
   const [value, setValue] = useState<string | null>(priority?._id || null);

   const { priorities } = useConstructionData();

   useEffect(() => {
      setValue(priority?._id || null);
   }, [priority]);

   const handlePriorityChange = (priorityId: string) => {
      setValue(priorityId);
      const newPriority = priorities?.find((p) => p._id === priorityId);
      if (newPriority) {
         onChange(newPriority);
      }
      setOpen(false);
   };

   return (
      <div className="*:not-first:mt-2">
         <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
               <Button
                  id={id}
                  className="flex items-center gap-2"
                  size="xs"
                  variant="secondary"
                  role="combobox"
                  aria-expanded={open}
               >
                  {priority && (
                     <div className="size-3 rounded-full bg-green-500 border border-green-600" />
                  )}
                  <span>{priority?.name || 'Выберите приоритет'}</span>
               </Button>
            </PopoverTrigger>
            <PopoverContent
               className="border-input w-full min-w-[var(--radix-popper-anchor-width)] p-0"
               align="start"
            >
               <Command>
                  <CommandInput placeholder="Выберите приоритет..." />
                  <CommandList>
                     <CommandEmpty>Приоритет не найден.</CommandEmpty>
                     <CommandGroup>
                        {priorities?.map((priorityItem) => (
                           <CommandItem
                              key={priorityItem._id}
                              value={priorityItem._id}
                              onSelect={() => handlePriorityChange(priorityItem._id)}
                              className="flex items-center justify-between"
                           >
                              <div className="flex items-center gap-2">
                                 <div className="size-3 rounded-full bg-green-500 border border-green-600" />
                                 {priorityItem.name}
                              </div>
                              {value === priorityItem._id && <CheckIcon size={16} className="ml-auto" />}
                           </CommandItem>
                        ))}
                     </CommandGroup>
                  </CommandList>
               </Command>
            </PopoverContent>
         </Popover>
      </div>
   );
}
