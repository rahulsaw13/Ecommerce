import { ToggleButton } from 'primereact/togglebutton';

const ToggleButton = ({checked}) => {
  return (
    <div>
        <ToggleButton 
            checked={checked} 
            onChange={(e) => setChecked(e.value)} 
        />
    </div>
  )
}

export default ToggleButton;