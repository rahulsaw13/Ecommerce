// Utils
import { useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Toast } from "primereact/toast";

// Components
import ButtonComponent from "@common/ButtonComponent";

const Confirmbox = ({ isConfirm, closeDialogbox, confirmDialogbox, header, message }) => {
  const { t } = useTranslation("msg");
  const toast = useRef(null);

  const accept = () => {
    toast.current.show({
      severity: "success",
      summary: t("delete_record"),
      detail: t("record_has_been_deleted_successfully"),
      life: 3000,
    });
  };

  useEffect(() => {
    if (isConfirm) {
      confirmDialog({
        group: "headless",
        message: message ? message :t("delete_confirmation_msg"),
        header: header ? header : t("are_you_sure"),
        defaultFocus: "accept",
        accept,
      });
    }
  }, [isConfirm]);

  return (
    <div>
      <Toast ref={toast} />
      <ConfirmDialog
        group="headless"
        content={({ headerRef, contentRef, footerRef, hide, message }) => (
          <div className="align-items-center flex flex-col rounded-lg bg-BgSecondaryColor border border-BorderColor p-6 shadow-lg">
            <div className="text-center mb-4">
              <i className="ri-error-warning-line text-[2.2rem] text-TextPrimaryColor"></i>
            </div>
            <div
              className="mb-4 block text-center text-lg font-semibold text-TextSecondaryColor"
              ref={headerRef}
            >
              {message.header}
            </div>
            <p className="mb-0 text-sm text-TextSecondaryColor text-center leading-relaxed max-w-sm opacity-80" ref={contentRef}>
              {message.message}
            </p>
            <div className="mt-6 flex justify-center gap-3" ref={footerRef}>
              <ButtonComponent
                onClick={(event) => {
                  hide(event);
                  closeDialogbox();
                }}
                type="button"
                label={t("cancel")}
                className="rounded-md bg-gray-500 hover:bg-gray-600 px-5 py-2.5 text-sm text-white font-medium transition-colors duration-200"
              />
              <ButtonComponent
                onClick={(event) => {
                  hide(event);
                  accept();
                  confirmDialogbox();
                }}
                type="button"
                label={t("confirm")}
                className="rounded-md bg-red-600 hover:bg-red-700 px-5 py-2.5 text-sm text-white font-medium transition-colors duration-200"
              />
            </div>
          </div>
        )}
      />
    </div>
  );
};

export default Confirmbox;
