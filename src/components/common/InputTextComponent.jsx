import { InputText } from "primereact/inputtext";

const InputTextComponent = ({
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
  min
}) => (
  <div className="custom-input-design w-full">
    {isLabel ? (
      <label className="text-[12px] text-TextPrimaryColor ms-[4px] font-[600]">{placeholder}</label>
    ) : null}
    <InputText
      value={value}
      onChange={onChange}
      type={type}
      id={id}
      placeholder={placeholder}
      name={name}
      className={className}
      required={required}
      disabled={disabled}
      onBlur={onBlur}
      min={min}
      onFocus={onFocus}
    />
    {error && touched ? (
      <p className="text-[0.7rem] text-red-600">{error}</p>
    ) : (
      ""
    )}
  </div>
);

export default InputTextComponent;
