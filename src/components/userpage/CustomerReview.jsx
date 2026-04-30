// utils
import React, { useEffect, useState } from 'react';
import { useTranslation } from "react-i18next";
import { Rating } from "primereact/rating";
import * as yup from "yup";
import { useFormik } from "formik";

// Components
import InputTextComponent from "@common/InputTextComponent";
import { allApi } from "@api/api";
import { API_CONSTANTS } from "@constants/apiurl";
import { refactorPrefilledDate } from '@helper';
import DefaultImage from "@assets/no-image.jpeg";
import UserLoader from '@userpage-pages/UserLoader';

const initialValues = {
  name: "",
  reviewHeading: "",
  rating: "",
  email: "",
  image: null
}

const CustomerReview = ({ id, getProductReview, reviews, overallRating }) => {
  const { t } = useTranslation("msg");
  const [addReview, setAddReview] = useState(false);
  const [review, setReview] = useState(initialValues);
  const [loader, setLoader] = useState(false);
  const [userDetails, setUserDetails] = useState({});

  const validationSchema = yup.object().shape({
    name: yup.string().required(t("name_is_required")),
    email: yup.string().required(t("email_is_required")),
    rating: yup.string().required(t("rating_is_required"))
  });

  useEffect(() => {
    setUserDetails(JSON.parse(localStorage.getItem("userDetails")));
  }, []);

  const onHandleSubmit = (value) => {
    let data = {
      name: value?.name,
      review_text: value?.reviewHeading,
      email: value?.email,
      rating: value?.rating,
      image: value?.image,
      product_id: id,
      user_id: userDetails?.id,
      is_verified: false
    }
    allApi(API_CONSTANTS.PRODUCT_REVIEW_URL, data, "post", 'multipart/form-data')
      .then((response) => {
        if (response?.status === 201) {
          getProductReview();
          resetForm();
          setFieldValue("image", null);
        }
      })
      .catch((err) => { })
      .finally(() => { });
  };

  const countRating = (stars) => {
    return reviews?.filter((item) => item?.rating === stars)?.length;
  }

  const formik = useFormik({
    initialValues: review,
    onSubmit: onHandleSubmit,
    validationSchema: validationSchema,
    enableReinitialize: true,
    validateOnBlur: true,
  });

  const { values, errors, resetForm, setFieldValue, handleSubmit, handleChange, touched } = formik;

  return (
    <>
      {loader ? <UserLoader /> :
        <>
          <div className="border rounded-lg p-4 bg-white shadow-sm mx-4">
            <h2 className="text-base font-bold mb-2">{t("customer_reviews")}</h2>
            <div className="flex items-center gap-2">
              <div className="flex text-yellow-500 text-sm">
                {[...Array(5)].map((item, index) => {
                  if (overallRating <= index) {
                    return (<i className="ri-star-line" key={index}></i>)
                  }
                  else {
                    return (<i className="ri-star-fill" key={index}></i>)
                  }
                })}
              </div>
              <p className="text-gray-600 text-xs"> {t("based_on")} {reviews?.length} {t("reviews")}</p>
            </div>
            <div className="mt-3 flex flex-col lg:flex-row justify-between gap-3">
              <div className="space-y-1.5">
                {[5, 4, 3, 2, 1]?.map((stars, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="flex text-yellow-500 text-xs">
                      {[...Array(stars)]?.map((_, i) => (
                        <i className="ri-star-fill" key={i}></i>
                      ))}
                    </div>
                    <div className="w-24 sm:w-32 h-1.5 bg-gray-200 rounded">
                      {stars === 5 && <div className="h-full bg-yellow-500 w-full rounded"></div>}
                    </div>
                    <p className="text-gray-600 text-[10px]">({countRating(stars)})</p>
                  </div>
                ))}
              </div>
              <button className="mt-2 sm:mt-0 px-3 py-1.5 border rounded text-xs h-[32px]" onClick={() => { setAddReview(!addReview) }}>
                {addReview ? t("cancel_review") : t("write_a_review")}
              </button>
            </div>
            {
              addReview ?
                <div className="mt-4 p-3 border rounded-lg bg-white">
                  <div className='mt-2'>
                    <p className="font-semibold mb-1.5 text-xs">{t("add_rating")}</p>
                    <Rating value={values?.rating} name="rating" cancel={false} onChange={handleChange} className="text-sm" />
                    {errors?.rating && touched?.rating ? (
                      <p className="text-[10px] text-red-600">{errors?.rating}</p>
                    ) : (
                      ""
                    )}
                  </div>
                  <div className="mb-2 mt-3">
                    <InputTextComponent
                      value={values?.name}
                      onChange={handleChange}
                      type="text"
                      placeholder={t("name")}
                      name="name"
                      error={errors?.name}
                      touched={touched?.name}
                      className="w-full text-xs mt-1 p-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-gray-300"
                    />
                  </div>
                  <div className="mb-2 mt-3">
                    <InputTextComponent
                      value={values?.email}
                      onChange={handleChange}
                      type="text"
                      placeholder={t("email")}
                      name="email"
                      error={errors?.email}
                      touched={touched?.email}
                      className="w-full text-xs mt-1 p-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-gray-300"
                    />
                  </div>
                  <div className="mb-3 mt-3 relative">
                    <p className="font-semibold mb-1.5 text-xs">{t("add_photo_or_video")}</p>
                    <div className="border border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center hover:bg-gray-100 relative">
                      <i className={`${values?.image ? "ri-cloud-fill text-lg" : "ri-cloud-line text-lg"}`}></i>
                      <span className="text-gray-600 text-[10px] mt-1">{values?.image ? t("file_has_been_uploaded", { name: values?.image?.name }) : t("click_here_to_upload")}</span>
                      <input
                        type="file"
                        name="image"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={(e) => {
                          setFieldValue('image', e?.currentTarget?.files[0]);
                        }}
                      />
                      {errors?.image && touched?.image ? (
                        <p className="text-[10px] text-red-600">{errors?.image}</p>
                      ) : (
                        ""
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold text-xs">{t("write_your_review")}</p>
                    <textarea
                      className="w-full text-xs mt-1 p-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-gray-300"
                      rows="3"
                      maxLength="400"
                      name="reviewHeading"
                      onChange={handleChange}
                      placeholder={t("would_you_like_to_write")}
                      value={values?.reviewHeading}
                    ></textarea>
                    <p className="text-right text-gray-500 text-[10px]">{400 - values?.reviewHeading?.length} {t("characters_remaining")}</p>
                  </div>
                  <div className='flex justify-end'>
                    <button className="mt-2 px-3 py-1.5 border rounded text-xs h-[32px]" onClick={() => handleSubmit()}>
                      {t("submit")}
                    </button>
                  </div>
                </div>
                : null
            }
            <div className="mt-4 border-t pt-3">
              {reviews?.map((review) => (
                <div key={review?.id} className="flex gap-3 mt-3">
                  <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-base font-bold flex-shrink-0">
                    {review.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <div className="flex text-yellow-500 text-xs">
                        {[...Array(5)].map((item, index) => {
                          if (review?.rating <= index) {
                            return (<i className="ri-star-line" key={index}></i>)
                          }
                          else {
                            return (<i className="ri-star-fill" key={index}></i>)
                          }
                        })}
                      </div>
                      <p className="text-gray-600 text-[10px]">{refactorPrefilledDate(review?.created_at)}</p>
                    </div>
                    <p className="font-bold flex items-center gap-2 text-sm">
                      {review.is_verified && (
                        <span className="text-[9px] bg-gray-800 text-white px-1.5 py-0.5 rounded-full">Verified</span>
                      )}
                      {review?.name}
                    </p>
                    <p className="text-gray-700 text-xs mt-0.5">{review?.review_text}</p>
                    <div className="flex items-center gap-2 w-full mt-1.5">
                      <div className="w-32 h-16 overflow-hidden rounded">
                        <img
                          src={review?.image_url ? review.image_url : DefaultImage}
                          alt={t("profile")}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      }
    </>
  )
}

export default CustomerReview;