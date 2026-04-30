import { Button } from 'primereact/button';
import { Badge } from 'primereact/badge';
import { Tooltip } from 'primereact/tooltip';
import { useEffect, useRef } from 'react';

const ButtonComponent = ({
    label,
    type,
    onClick,
    disabled,
    icon,
    className,
    tooltip,
    tooltipOptions,
    loading,
    iconPos,
    isBadge
}) => {
    const buttonRef = useRef(null);
    const tooltipId = `tooltip-${Math.random().toString(36).substr(2, 9)}`;

    useEffect(() => {
        if (tooltip && tooltipOptions && buttonRef.current) {
            const button = buttonRef.current;
            if (button) {
                button.classList.add(tooltipId);
                button.setAttribute('data-pr-tooltip', tooltip);
                if (tooltipOptions.position) button.setAttribute('data-pr-position', tooltipOptions.position);
                if (tooltipOptions.at) button.setAttribute('data-pr-at', tooltipOptions.at);
                if (tooltipOptions.my) button.setAttribute('data-pr-my', tooltipOptions.my);
            }
        }
    }, [tooltip, tooltipOptions, tooltipId]);

    return (
        <div className='custom-button-design relative'>
            {tooltip && tooltipOptions && <Tooltip target={`.${tooltipId}`} />}
            {isBadge ? <Badge severity="danger" className='absolute top-0 right-0'></Badge> : null}
            <Button
                ref={buttonRef}
                label={label}
                type={type}
                onClick={onClick}
                className={className}
                disabled={disabled}
                icon={icon}
                tooltip={!tooltipOptions ? tooltip : undefined}
                loading={loading}
                iconPos={iconPos}
            />
        </div>
    );
};

export default ButtonComponent;