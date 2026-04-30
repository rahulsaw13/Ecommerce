import { InputTextarea } from "primereact/inputtextarea";

const InputTextAreaComponent = ({
  value,
  type,
  id,
  placeholder,
  onChange,
  name,
  className,
  required,
  disabled = false,
  onBlur,
  onFocus,
  error,
  touched,
  isLabel,
  rows, 
  cols
}) => (
  <div className="custom-input-design w-full">
    {isLabel ? (
      <label className="text-[12px] text-TextPrimaryColor ms-[4px] font-[600]">{placeholder}</label>
    ) : null}
    <InputTextarea 
      value={value}
      onChange={onChange}
      type={type}
      rows={rows} 
      cols={cols}
      id={id}
      placeholder={placeholder}
      name={name}
      className={className}
      required={required}
      disabled={disabled}
      onBlur={onBlur}
      onFocus={onFocus}
    />
    {error && touched ? (
      <p className="text-[0.7rem] text-red-600">{error}</p>
    ) : (
      ""
    )}
  </div>
);

export default InputTextAreaComponent;