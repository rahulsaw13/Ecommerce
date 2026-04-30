// utils
import { Dropdown } from 'primereact/dropdown';

const DropdownComponent = ({value, name, editable, data, onChange, disabled, optionLabel, optionValue, placeholder, className, error, touched, showLabel=true}) => {
  return (
    <div className='w-full'>
       {placeholder && showLabel ? (
          <label className="text-[12px] text-TextPrimaryColor ms-[4px] font-[600]">{placeholder}</label>
        ) : null}
        <Dropdown
            name={name}
            value={value}
            onChange={(e) => onChange(name, e.value)}
            options={data}
            editable={editable}
            disabled={disabled}
            optionLabel={optionLabel}
            optionValue={optionValue}
            placeholder={placeholder}
            className={className}
         />
         {error && touched ? (
            <p className="text-[0.7rem] text-red-600">{error}</p>
          ) : (
            ""
          )}
    </div>
  )
}

export default DropdownComponent;