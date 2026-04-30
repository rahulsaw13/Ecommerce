export const CheckboxComponent = ({checked, onChange}) => {
  return (
    <div className={`p-checkbox ${checked ? 'p-highlight' : ''}`}>
      <div className={`p-checkbox-box ${checked ? 'p-highlight' : ''}`}>
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="native-checkbox"
        />
        <span className="p-checkbox-icon">{checked ? '✔' : ''}</span>
      </div>
    </div>
  )
}