import React from 'react';

interface TextAreaInputProps {
  label: string;
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
}

const TextAreaInput: React.FC<TextAreaInputProps> = ({ label, id, value, onChange, placeholder, rows = 4, disabled = false }) => {
  // Use provided id, or generate one from label. If both are missing, it will be undefined.
  const elementId = id || (label ? label.replace(/\s+/g, '-').toLowerCase() : undefined);

  return (
    <div>
      {label && (
        <label htmlFor={elementId} className="block text-sm font-medium text-gray-400 mb-2">
          {label}
        </label>
      )}
      <textarea
        id={elementId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        className="w-full bg-gray-900/80 border border-gray-700 text-white rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
      />
    </div>
  );
};

export default TextAreaInput;
