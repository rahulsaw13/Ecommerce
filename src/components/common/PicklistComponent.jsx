// Utils
import React from 'react';
import { PickList } from 'primereact/picklist';

// Components
import DefaultImage from "@assets/no-image.jpeg";
import Image from "@common/Image";

const PicklistComponent = ({onChange, source, target, placeholder, error, touched}) => {

    const itemTemplate = (item) => {
        return (
            <div className="flex flex-wrap p-2 align-items-center gap-3">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 overflow-hidden rounded-full">
                        <Image 
                            src={item?.image_url ? item.image_url : DefaultImage} 
                            alt="Profile" 
                            className="w-full h-full object-cover" 
                        />
                    </div>
                    <div>
                        <div className='font-[600] text-[0.8rem]'>{item?.name} - {item?.weight}</div>
                        <div className='text-[0.8rem]'>{item?.description}</div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
            {placeholder ? (
            <label className="text-[12px] text-TextPrimaryColor ms-[4px] font-[600]">{placeholder}</label>
            ) : null}
            <PickList 
                dataKey="id" 
                source={source} 
                target={target} 
                onChange={onChange} 
                itemTemplate={itemTemplate} 
                filter 
                filterBy="name" 
                breakpoint="1280px"
                className='custom-picklist mt-2'
                sourceHeader="Available" 
                targetHeader="Selected" 
                sourceStyle={{ height: '24rem' }} 
                targetStyle={{ height: '24rem' }}
                sourceFilterPlaceholder="Search by name" 
                targetFilterPlaceholder="Search by name" 
            />
            {error && touched ? (
                <p className="text-[0.7rem] text-red-600">{error}</p>
            ) : (
                ""
            )}
        </>
    );
}

export default PicklistComponent