import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { getDay, getDaysInMonth, isSameDay } from 'date-fns';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { type ReactNode, createContext, useContext, useState } from 'react';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
    className,
    classNames,
    showOutsideDays = true,
    ...props
}: CalendarProps) {
    return (
        <DayPicker
            showOutsideDays={showOutsideDays}
            className={cn('p-3', className)}
            classNames={{
                months: 'flex flex-col relative',
                month_caption: 'flex justify-center h-7 mx-10 relative items-center',
                weekdays: 'flex flex-row',
                weekday: 'text-muted-foreground w-8 font-normal text-[0.8rem]',
                month: 'gap-y-4 overflow-x-hidden w-full',
                caption: 'flex justify-center pt-1 relative items-center',
                caption_label: 'text-sm font-medium truncate',
                button_next: cn(
                    buttonVariants({
                        variant: 'outline',
                        className:
                            'absolute right-0 h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100',
                    }),
                ),
                button_previous: cn(
                    buttonVariants({
                        variant: 'outline',
                        className:
                            'absolute left-0 h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100',
                    }),
                ),
                nav: 'flex items-start justify-between absolute w-full',
                month_grid: 'mt-4',
                week: 'flex w-full mt-2',
                day: 'p-0 size-8 text-sm flex-1 flex items-center justify-center has-[button]:hover:!bg-accent rounded-md has-[button]:hover:aria-selected:!bg-primary has-[button]:hover:text-accent-foreground has-[button]:hover:aria-selected:text-primary-foreground',
                day_button: cn(
                    buttonVariants({ variant: 'ghost' }),
                    'size-8 p-0 font-normal transition-none hover:bg-transparent hover:text-inherit aria-selected:opacity-100',
                ),
                range_start: 'day-range-start rounded-s-md',
                range_end: 'day-range-end rounded-e-md',
                selected:
                    'bg-primary text-primary-foreground hover:!bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground',
                today: 'bg-accent text-accent-foreground',
                outside:
                    'day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30',
                disabled: 'text-muted-foreground opacity-50',
                range_middle:
                    'aria-selected:bg-accent hover:aria-selected:!bg-accent rounded-none aria-selected:text-accent-foreground hover:aria-selected:text-accent-foreground',
                hidden: 'invisible',
                ...classNames,
            }}
            components={{
                PreviousMonthButton: ({ ...props }) => (
                    <button
                        onClick={props.onClick}
                    >
                        <ChevronLeft className="h-4 w-4 cursor-pointer" />
                    </button>
                ),
                NextMonthButton: ({ ...props }) => (
                    <button
                        onClick={props.onClick}
                    >
                        <ChevronRight className="h-4 w-4 cursor-pointer" />
                    </button>
                ),
            }}
            {...props}
        />
    );
}
Calendar.displayName = 'Calendar';

type CalendarState = {
    month: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;
    year: number;
    setMonth: (month: CalendarState['month']) => void;
    setYear: (year: CalendarState['year']) => void;
};

const useCalendar = create<CalendarState>()(
    devtools((set) => ({
        month: new Date().getMonth() as CalendarState['month'],
        year: new Date().getFullYear(),
        setMonth: (month: CalendarState['month']) => set(() => ({ month })),
        setYear: (year: CalendarState['year']) => set(() => ({ year })),
    }))
);

type CalendarContextProps = {
    locale: Intl.LocalesArgument;
    startDay: number;
};

const CalendarContext = createContext<CalendarContextProps>({
    locale: 'en-US',
    startDay: 0,
});

type Status = {
    id: string;
    name: string;
    color: string;
};

type ComboboxProps = {
    value: string;
    setValue: (value: string) => void;
    data: {
        value: string;
        label: string;
    }[];
    labels: {
        button: string;
        empty: string;
        search: string;
    };
    className?: string;
};

const monthsForLocale = (
    localeName: Intl.LocalesArgument,
    monthFormat: Intl.DateTimeFormatOptions['month'] = 'long'
) => {
    const format = new Intl.DateTimeFormat(localeName, { month: monthFormat })
        .format;

    return [...new Array(12).keys()].map((m) =>
        format(new Date(Date.UTC(2021, m % 12)))
    );
};

const daysForLocale = (locale: Intl.LocalesArgument, startDay: number) => {
    const weekdays: string[] = [];
    const baseDate = new Date(2024, 0, startDay);

    for (let i = 0; i < 7; i++) {
        weekdays.push(
            new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(baseDate)
        );
        baseDate.setDate(baseDate.getDate() + 1);
    }

    return weekdays;
};

const Combobox = ({
    value,
    setValue,
    data,
    labels,
    className,
}: ComboboxProps) => {
    const [open, setOpen] = useState(false);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    aria-expanded={open}
                    className={cn('w-40 justify-between capitalize', className)}
                >
                    {value
                        ? data.find((item) => item.value === value)?.label
                        : labels.button}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-40 p-0">
                <Command
                    filter={(value, search) => {
                        const label = data.find((item) => item.value === value)?.label;

                        return label?.toLowerCase().includes(search.toLowerCase()) ? 1 : 0;
                    }}
                >
                    <CommandInput placeholder={labels.search} />
                    <CommandList>
                        <CommandEmpty>{labels.empty}</CommandEmpty>
                        <CommandGroup>
                            {data.map((item) => (
                                <CommandItem
                                    key={item.value}
                                    value={item.value}
                                    onSelect={(currentValue) => {
                                        setValue(currentValue === value ? '' : currentValue);
                                        setOpen(false);
                                    }}
                                    className="capitalize"
                                >
                                    <Check
                                        className={cn(
                                            'mr-2 h-4 w-4',
                                            value === item.value ? 'opacity-100' : 'opacity-0'
                                        )}
                                    />
                                    {item.label}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
};

type OutOfBoundsDayProps = {
    day: number;
};

const OutOfBoundsDay = ({ day }: OutOfBoundsDayProps) => (
    <div className="relative h-full w-full bg-secondary p-1 text-muted-foreground text-xs">
        {day}
    </div>
);

// type Feature = {
//     id: string;
//     name: string;
//     startAt: Date;
//     endAt: Date;
//     status: Status;
// };

type CalendarItem = {
    endAt: string
}

type CalendarBodyProps<T extends CalendarItem> = {
    items: T[];
    maxItems?: number;
    children: (props: {
        item: T;
    }) => ReactNode;
};

const CalendarBody = <T extends CalendarItem,>({ items, children, maxItems = 3 }: CalendarBodyProps<T>) => {
    const { month, year } = useCalendar();
    const { startDay } = useContext(CalendarContext);
    const daysInMonth = getDaysInMonth(new Date(year, month, 1));
    const firstDay = (getDay(new Date(year, month, 1)) - startDay + 7) % 7;
    const days: ReactNode[] = [];

    const prevMonth = month === 0 ? 11 : month - 1;
    const prevMonthYear = month === 0 ? year - 1 : year;
    const prevMonthDays = getDaysInMonth(new Date(prevMonthYear, prevMonth, 1));
    const prevMonthDaysArray = Array.from(
        { length: prevMonthDays },
        (_, i) => i + 1
    );

    for (let i = 0; i < firstDay; i++) {
        const day = prevMonthDaysArray[prevMonthDays - firstDay + i];

        if (day) {
            days.push(<OutOfBoundsDay key={`prev-${i}`} day={day} />);
        }
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const itemsForDay = items.filter((item) => {
            return isSameDay(new Date(item.endAt), new Date(year, month, day));
        });

        days.push(
            <div
                key={day}
                className="relative flex h-full w-full flex-col gap-1 p-1 text-muted-foreground text-xs"
            >
                {day}
                <div className="overflow-auto scrollbar-thin scrollbar-thumb-muted scrollbar-corner-rounded-full h-full">
                    {itemsForDay.slice(0, maxItems).map((item) => children({ item }))}
                </div>
                {itemsForDay.length > maxItems && (
                    <span className="block text-muted-foreground text-xs">
                        +{itemsForDay.length - maxItems} more
                    </span>
                )}
            </div>
        );
    }

    const nextMonth = month === 11 ? 0 : month + 1;
    const nextMonthYear = month === 11 ? year + 1 : year;
    const nextMonthDays = getDaysInMonth(new Date(nextMonthYear, nextMonth, 1));
    const nextMonthDaysArray = Array.from(
        { length: nextMonthDays },
        (_, i) => i + 1
    );

    const remainingDays = 7 - ((firstDay + daysInMonth) % 7);
    if (remainingDays < 7) {
        for (let i = 0; i < remainingDays; i++) {
            const day = nextMonthDaysArray[i];

            if (day) {
                days.push(<OutOfBoundsDay key={`next-${i}`} day={day} />);
            }
        }
    }

    return (
        <div className="grid flex-grow grid-cols-7 h-full min-h-0">
            {days.map((day, index) => (
                <div
                    key={index}
                    className={cn(
                        'relative aspect-square overflow-hidden border-t border-r size-full',
                        index % 7 === 6 && 'border-r-0'
                    )}
                >
                    {day}
                </div>
            ))}
        </div>
    );
};

// const CalendarItem = <T,>({ item, className }: CalendarItemProps) => (
//     <div className={cn('flex items-center gap-2', className)} key={item.id}>
//         <div
//             className="h-2 w-2 shrink-0 rounded-full"
//             style={{
//                 backgroundColor: feature.status.color,
//             }}
//         />
//         <span className="truncate">{feature.name}</span>
//     </div>
// );

type CalendarDatePickerProps = {
    className?: string;
    children: ReactNode;
};

const CalendarDatePicker = ({
    className,
    children,
}: CalendarDatePickerProps) => (
    <div className={cn('flex items-center gap-1', className)}>{children}</div>
);

type CalendarMonthPickerProps = {
    className?: string;
};

const CalendarMonthPicker = ({
    className,
}: CalendarMonthPickerProps) => {
    const { month, setMonth } = useCalendar();
    const { locale } = useContext(CalendarContext);

    return (
        <Combobox
            className={className}
            value={month.toString()}
            setValue={(value) => {
                if (value === '') return;

                setMonth(Number.parseInt(value) as CalendarState['month'])
            }}
            data={monthsForLocale(locale).map((month, index) => ({
                value: index.toString(),
                label: month,
            }))}
            labels={{
                button: 'Select month',
                empty: 'No month found',
                search: 'Search month',
            }}
        />
    );
};

type CalendarYearPickerProps = {
    className?: string;
    start: number;
    end: number;
};

const CalendarYearPicker = ({
    className,
    start,
    end,
}: CalendarYearPickerProps) => {
    const { year, setYear } = useCalendar();

    return (
        <Combobox
            className={className}
            value={year.toString()}
            setValue={(value) => {
                if (value === '') return;

                setYear(Number.parseInt(value))
            }}
            data={Array.from({ length: end - start + 1 }, (_, i) => ({
                value: (start + i).toString(),
                label: (start + i).toString(),
            }))}
            labels={{
                button: 'Select year',
                empty: 'No year found',
                search: 'Search year',
            }}
        />
    );
};

type CalendarDatePaginationProps = {
    className?: string;
    previousText?: string;
    nextText?: string;
};

const CalendarDatePagination = ({
    className,
    previousText = 'Previous month',
    nextText = 'Next month',
}: CalendarDatePaginationProps) => {
    const { month, year, setMonth, setYear } = useCalendar();

    const handlePreviousMonth = () => {
        if (month === 0) {
            setMonth(11);
            setYear(year - 1);
        } else {
            setMonth((month - 1) as CalendarState['month']);
        }
    };

    const handleNextMonth = () => {
        if (month === 11) {
            setMonth(0);
            setYear(year + 1);
        } else {
            setMonth((month + 1) as CalendarState['month']);
        }
    };

    return (
        <div className={cn('flex items-center gap-2', className)}>
            <Button onClick={() => handlePreviousMonth()} variant="ghost" size="icon" className="w-auto flex items-center gap-2">
                <ChevronLeftIcon size={16} />

                <span className="block sm:hidden">{previousText}</span>
            </Button>
            <Button onClick={() => handleNextMonth()} variant="ghost" size="icon" className="w-auto flex items-center gap-2">
                <span className="block sm:hidden">{nextText}</span>

                <ChevronRightIcon size={16} />
            </Button>
        </div>
    );
};

type CalendarDateProps = {
    children: ReactNode;
    className?: string;
};

const CalendarDate = ({ children, className }: CalendarDateProps) => (
    <div className={cn("flex items-center justify-between p-3", className)}>{children}</div>
);

type CalendarHeaderProps = {
    className?: string;
    textDirection?: "left" | "center" | "right";
};

const CalendarHeader = ({ className, textDirection }: CalendarHeaderProps) => {
    const { locale, startDay } = useContext(CalendarContext);

    return (
        <div className={cn('grid flex-grow grid-cols-7', className)}>
            {daysForLocale(locale, startDay).map((day) => (
                <div key={day} className={cn(
                    "p-3 text-muted-foreground text-xs",
                    textDirection === "center" ? "text-center" : textDirection === "right" ? "text-right" : "text-left"
                )}>
                    {day}
                </div>
            ))}
        </div>
    );
};

type CalendarProviderProps = {
    locale?: Intl.LocalesArgument;
    startDay?: number;
    children: ReactNode;
    className?: string;
};

const CalendarProvider = ({
    locale = 'en-US',
    startDay = 0,
    children,
    className,
}: CalendarProviderProps) => (
    <CalendarContext.Provider value={{ locale, startDay }}>
        <div className={cn('relative flex flex-col size-full', className)}>{children}</div>
    </CalendarContext.Provider>
);

export {
    Calendar,
    CalendarProvider,
    CalendarBody,
    CalendarDatePicker,
    CalendarDatePagination,
    CalendarDate,
    CalendarHeader,
    // CalendarItem,
    CalendarMonthPicker,
    CalendarYearPicker,
    Combobox,
    OutOfBoundsDay,
    useCalendar,
    CalendarContext,
};

export type { CalendarState, CalendarContextProps, Status, /*Feature,*/ ComboboxProps, OutOfBoundsDayProps, CalendarBodyProps, CalendarDatePickerProps, CalendarMonthPickerProps, CalendarYearPickerProps, CalendarDatePaginationProps, CalendarDateProps, CalendarHeaderProps, /*CalendarItemProps,*/ CalendarProviderProps };