import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { useTranslation } from "react-i18next";
import { allApiWithHeaderToken } from "@api/api";
import { API_CONSTANTS } from "@constants/apiurl";
import ButtonComponent from "@common/ButtonComponent";
import InputTextComponent from "@common/InputTextComponent";
import DropdownComponent from "@common/DropdownComponent";
import { Formik, Form } from "formik";
import * as Yup from "yup";

const ProductVariantDialog = ({ visible, onHide, product, toast }) => {
  const { t } = useTranslation("msg");
  const [variants, setVariants] = useState([]);
  const [weightOptions, setWeightOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingVariant, setEditingVariant] = useState(null);

  // Validation schema
  const validationSchema = Yup.object().shape({
    weight_master_id: Yup.string().required(t("weight_required")),
    mrp: Yup.number()
      .required("MRP is required")
      .positive("MRP must be positive"),
    price: Yup.number()
      .required("Selling price is required")
      .positive("Selling price must be positive")
      .test('less-than-mrp', 'Selling price must be less than or equal to MRP', function(value) {
        const { mrp } = this.parent;
        return !mrp || !value || value <= mrp;
      }),
    shelf_life: Yup.number()
      .required(t("shelf_life_required"))
      .positive(t("shelf_life_must_be_positive"))
      .integer(t("shelf_life_must_be_integer")),
  });

  // Initial form values
  const initialValues = {
    weight_master_id: '',
    mrp: '',
    price: '',
    shelf_life: '',
    status: 1
  };

  useEffect(() => {
    if (visible) {
      fetchVariants();
      fetchWeightOptions();
    }
  }, [visible, product]);

  const fetchVariants = () => {
    setLoading(true);
    allApiWithHeaderToken(
      `${API_CONSTANTS.COMMON_PRODUCTS_URL}/${product.id}/variants`,
      {},
      "get"
    )
      .then((response) => {
        if (response.status === 200) {
          setVariants(response.data.data || []);
        }
      })
      .catch((err) => {
        toast.current.show({
          severity: "error",
          summary: "Error",
          detail: err?.response?.data?.errors || "Failed to fetch variants",
          life: 3000,
        });
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const fetchWeightOptions = () => {
    allApiWithHeaderToken(
      `${API_CONSTANTS.COMMON_MASTERS_URL}/by_type/weight`,
      {},
      "get"
    )
      .then((response) => {
        if (response.status === 200) {
          const weights = response.data.data || [];
          setWeightOptions(weights);
        }
      })
      .catch((err) => {
        toast.current.show({
          severity: "error",
          summary: "Error",
          detail: "Failed to fetch weight options",
          life: 3000,
        });
        setWeightOptions([]);
      });
  };

  const handleSubmit = (values, { resetForm, setSubmitting }) => {
    const apiUrl = editingVariant
      ? `api/v1/product_variants/${editingVariant.id}`
      : `${API_CONSTANTS.COMMON_PRODUCTS_URL}/${product.id}/variants`;
    
    const method = editingVariant ? "patch" : "post";
    const payload = {
      product_variant: {
        weight_master_id: values.weight_master_id,
        weight: weightOptions.find(w => w.id === parseInt(values.weight_master_id))?.name || '',
        mrp: parseFloat(values.mrp),
        price: parseFloat(values.price),
        shelf_life: parseInt(values.shelf_life),
        status: values.status
      }
    };

    allApiWithHeaderToken(apiUrl, payload, method)
      .then((response) => {
        if (response.status === 200 || response.status === 201) {
          toast.current.show({
            severity: "success",
            summary: "Success",
            detail: editingVariant ? "Variant updated successfully" : "Variant added successfully",
            life: 3000,
          });
          resetForm();
          setEditingVariant(null);
          fetchVariants();
        }
      })
      .catch((err) => {
        toast.current.show({
          severity: "error",
          summary: "Error",
          detail: err?.response?.data?.errors || "Failed to save variant",
          life: 3000,
        });
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  const handleEdit = (variant) => {
    setEditingVariant(variant);
  };

  const handleDelete = (variantId) => {
    if (window.confirm('Are you sure you want to delete this variant?')) {
      allApiWithHeaderToken(
        `api/v1/product_variants/${variantId}`,
        {},
        "delete"
      )
        .then((response) => {
          if (response.status === 200) {
            toast.current.show({
              severity: "success",
              summary: "Success",
              detail: "Variant deleted successfully",
              life: 3000,
            });
            fetchVariants();
          }
        })
        .catch((err) => {
          toast.current.show({
            severity: "error",
            summary: "Error",
            detail: err?.response?.data?.errors || "Failed to delete variant",
            life: 3000,
          });
        });
    }
  };

  const headerElement = (
    <div className="flex items-center justify-between w-full">
      <span className="font-[600] text-[14px] text-TextPrimaryColor">
        {t("manage_variants")} - {product.name}
      </span>
      {variants.length > 0 && (
        <span className="text-[11px] bg-green-100 text-green-700 px-2 py-1 rounded">
          {variants.length} {t("variants")}
        </span>
      )}
    </div>
  );

  return (
    <Dialog
      visible={visible}
      modal
      header={headerElement}
      style={{ width: '95%', maxWidth: '1000px' }}
      onHide={onHide}
      draggable={false}
      className="product-variant-dialog"
    >
      <div className="space-y-4">
        {/* Add/Edit Variant Form */}
        <div className="bg-white p-4 rounded border border-BorderColor">
          <h3 className="text-[12px] font-[600] mb-3 text-TextPrimaryColor">
            {editingVariant ? t("edit_variant") : t("add_new_variant")}
          </h3>
          <Formik
            initialValues={editingVariant ? {
              weight_master_id: editingVariant.weight_master_id?.toString() || '',
              mrp: editingVariant.mrp?.toString() || editingVariant.price?.toString() || '',
              price: editingVariant.price?.toString() || '',
              shelf_life: editingVariant.shelf_life?.toString() || '',
              status: editingVariant.status
            } : initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
            enableReinitialize
          >
            {({ values, errors, touched, handleChange, handleBlur, setFieldValue, isSubmitting }) => (
              <Form>
                <div className="grid grid-cols-5 gap-4 items-end">
                  <div className="flex flex-col">
                    <DropdownComponent
                      value={values.weight_master_id}
                      onChange={(name, value) => setFieldValue(name, value)}
                      name="weight_master_id"
                      data={weightOptions}
                      optionLabel="name"
                      optionValue="id"
                      placeholder={t("weight")}
                      error={errors.weight_master_id}
                      touched={touched.weight_master_id}
                      showLabel={true}
                      className="col-span-2 w-full rounded border-[1px] border-[#ddd] custom-dropdown focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col">
                    <InputTextComponent
                      value={values.mrp}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      isLabel={true}
                      placeholder="MRP"
                      name="mrp"
                      type="number"
                      step="0.01"
                      error={errors.mrp}
                      touched={touched.mrp}
                      className="w-full rounded border-[1px] border-BorderColor px-[1rem] py-[8px] text-[11px] focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col">
                    <InputTextComponent
                      value={values.price}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      isLabel={true}
                      placeholder="Selling Price"
                      name="price"
                      type="number"
                      step="0.01"
                      error={errors.price}
                      touched={touched.price}
                      className="w-full rounded border-[1px] border-BorderColor px-[1rem] py-[8px] text-[11px] focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col">
                    <InputTextComponent
                      value={values.shelf_life}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      isLabel={true}
                      placeholder={t("shelf_life_days")}
                      name="shelf_life"
                      type="number"
                      error={errors.shelf_life}
                      touched={touched.shelf_life}
                      className="w-full rounded border-[1px] border-BorderColor px-[1rem] py-[8px] text-[11px] focus:outline-none"
                    />
                  </div>

                  <div className="flex gap-2">
                    {editingVariant && (
                      <ButtonComponent
                        type="button"
                        onClick={() => setEditingVariant(null)}
                        label={t("cancel")}
                        className="rounded bg-white hover:bg-gray-100 border border-BorderColor px-4 py-2 text-[11px] text-TextPrimaryColor transition"
                      />
                    )}
                    <ButtonComponent
                      type="submit"
                      icon="ri-add-line"
                      label={editingVariant ? t("update") : ""}
                      className="rounded bg-TextPrimaryColor hover:bg-opacity-90 px-4 py-2 text-[11px] text-white transition"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </Form>
            )}
          </Formik>
        </div>

        {/* Variants List - Always Show */}
        <div className="bg-BgSecondaryColor border rounded border-BorderColor">
          <div className="p-3 border-b border-BorderColor">
            <h3 className="text-[12px] font-[600] text-TextPrimaryColor">
              {t("existing_variants")}
            </h3>
          </div>
          <div className="overflow-x-auto variants-table-container">
            <div className="custom-table">
              <div className="thead">
                <div className="tr bg-gray-100 border-b border-gray-300">
                  <div className="th p-3 text-left font-semibold text-sm">{t("weight")}</div>
                  <div className="th p-3 text-left font-semibold text-sm">MRP</div>
                  <div className="th p-3 text-left font-semibold text-sm">Selling Price</div>
                  <div className="th p-3 text-left font-semibold text-sm">{t("shelf_life_days")}</div>
                  <div className="th p-3 text-center font-semibold text-sm">{t("status")}</div>
                  <div className="th p-3 text-center font-semibold text-sm">{t("action")}</div>
                </div>
              </div>
              <div className="tbody">
                {loading ? (
                  // Skeleton loading state
                  <>
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="tr border-b border-gray-300 animate-pulse">
                        <div className="td p-3"><div className="h-4 bg-gray-200 rounded w-24"></div></div>
                        <div className="td p-3"><div className="h-4 bg-gray-200 rounded w-16"></div></div>
                        <div className="td p-3"><div className="h-4 bg-gray-200 rounded w-16"></div></div>
                        <div className="td p-3"><div className="h-4 bg-gray-200 rounded w-20"></div></div>
                        <div className="td p-3 text-center"><div className="h-4 bg-gray-200 rounded w-16 mx-auto"></div></div>
                        <div className="td p-3 text-center"><div className="h-4 bg-gray-200 rounded w-12 mx-auto"></div></div>
                      </div>
                    ))}
                  </>
                ) : variants.length === 0 ? (
                  <div className="tr border-b border-gray-300">
                    <div className="td p-8 text-center text-gray-500" style={{ gridColumn: '1 / -1' }}>
                      <div className="flex flex-col items-center gap-2">
                        <i className="ri-file-list-3-line text-3xl text-gray-400"></i>
                        <p className="text-sm">{t("no_variants_available")}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  variants.map((variant) => (
                    <div key={variant.id} className="tr border-b border-gray-300 hover:bg-gray-50">
                      <div className="td p-3 font-medium text-sm">{variant.weight_display || variant.weight}</div>
                      <div className="td p-3 font-semibold text-gray-700 text-sm">₹{parseFloat(variant.mrp || variant.price).toFixed(2)}</div>
                      <div className="td p-3 font-semibold text-green-600 text-sm">₹{parseFloat(variant.price).toFixed(2)}</div>
                      <div className="td p-3 text-sm">{variant.shelf_life} {t("days")}</div>
                      <div className="td p-3 text-center text-sm">
                        <span className={variant.status === 1 ? 'text-green-600' : 'text-red-600'}>
                          {variant.status === 1 ? t("active") : t("inactive")}
                        </span>
                      </div>
                      <div className="td p-3 text-center text-sm">
                        <div className="flex gap-2 justify-center">
                          <ButtonComponent
                            icon="ri-pencil-line"
                            className="text-sm hover:text-blue-600 transition"
                            onClick={() => handleEdit(variant)}
                            tooltip={t("edit")}
                          />
                          <ButtonComponent
                            icon="ri-delete-bin-line"
                            className="text-sm hover:text-red-600 transition"
                            onClick={() => handleDelete(variant.id)}
                            tooltip={t("delete")}
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Custom CSS for Grid Table */}
        <style jsx>{`
          .variants-table-container .custom-table {
            display: block;
            width: 100%;
          }
          .variants-table-container .custom-table .thead,
          .variants-table-container .custom-table .tbody {
            display: block;
          }
          .variants-table-container .custom-table .tr {
            display: grid;
            grid-template-columns: minmax(150px, 1.5fr) minmax(100px, 1fr) minmax(120px, 1fr) minmax(120px, 1fr) minmax(100px, 0.8fr) minmax(120px, 1fr);
            gap: 0;
          }
          .variants-table-container .custom-table .th,
          .variants-table-container .custom-table .td {
            border-right: 1px solid #d1d5db;
          }
          .variants-table-container .custom-table .th:last-child,
          .variants-table-container .custom-table .td:last-child {
            border-right: none;
          }
        `}</style>

        {/* Footer */}
        <div className="flex justify-end pt-3 border-t border-BorderColor">
          <ButtonComponent
            onClick={onHide}
            label={t("close")}
            className="rounded bg-white hover:bg-gray-100 border border-BorderColor px-6 py-2 text-[11px] text-TextPrimaryColor transition"
          />
        </div>
      </div>
    </Dialog>
  );
};

export default ProductVariantDialog;
