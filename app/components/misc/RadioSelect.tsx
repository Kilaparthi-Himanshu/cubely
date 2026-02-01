import { FormControlLabel, Radio, RadioGroup } from '@mui/material';

type RadioOption<T extends string> = {
    value: T;
    label: string;
    disabled?: boolean;
};

type RadioSelectProps<T extends string> = {
    value: T | null;
    options: readonly RadioOption<T>[];
    onChange: (value: T) => void;
};

export function RadioSelect<T extends string> ({
    value,
    options,
    onChange
}: RadioSelectProps<T>) {
    return (
        <RadioGroup
            value={value ?? ""}
            onChange={(e) =>
                onChange(e.target.value as T)
            }
        >
            {options.map((opt) => (
                <FormControlLabel
                    key={opt.value}
                    value={opt.value}
                    control={
                        <Radio
                            sx={{
                                color: '#fff', // unchecked ring
                                '&.Mui-checked': {
                                color: '#fbbf24', // checked ring
                                },
                            }}
                        />
                    }
                    label={opt.label}
                    disabled={opt.disabled}
                />
            ))}
        </RadioGroup>
    );
}
