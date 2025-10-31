import React from 'react';

interface SliderInputProps {
  label: string;
  id: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
  unit?: string;
  disabled?: boolean;
}

const SliderInput: React.FC<SliderInputProps> = ({ label, id, min, max, step, value, onChange, unit, disabled = false }) => {
  return (
    <div className={disabled ? 'opacity-50' : ''}>
      <label htmlFor={id} className="flex justify-between items-center text-sm font-medium text-gray-400 mb-2">
        <span>{label}</span>
        <span className="text-white font-semibold bg-slate-700/50 px-2 py-0.5 rounded-md text-xs">{value.toFixed(2)}{unit}</span>
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        disabled={disabled}
        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-green-500 disabled:cursor-not-allowed"
      />
    </div>
  );
};

export default SliderInput;
