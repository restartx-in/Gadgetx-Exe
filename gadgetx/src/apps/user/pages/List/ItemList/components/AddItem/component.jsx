import { useState, useEffect, useRef } from "react";
import useCreateItem from "@/hooks/api/item/useCreateItem";
import useUpdateItem from "@/hooks/api/item/useUpdateItem";
import useFetchPrintSettings from "@/hooks/api/printSettings/useFetchPrintSettings";
import useDeleteItem from "@/hooks/api/item/useDeleteItem";
import { Transaction } from "@/constants/object/transaction";
import { API_FILES } from "@/config/api";

import InputField from "@/components/InputField";
import { Modal, ModalHeader, ModalFooter, ModalBody } from "@/components/Modal";
import { useToast } from "@/context/ToastContext";
import { CRUDTYPE, CRUDITEM } from "@/constants/object/crud";
import { TOASTSTATUS, TOASTTYPE } from "@/constants/object/toastType";
import TextArea from "@/components/TextArea";
import Title from "@/apps/user/components/Title";
import { Report } from "@/constants/object/report";
import CancelButton from "@/apps/user/components/CancelButton";
import SubmitButton from "@/apps/user/components/SubmitButton";
import DeleteTextButton from "@/apps/user/components/DeleteTextButton";
import SupplierAutoCompleteWithAddOption from "@/apps/user/components/SupplierAutoCompleteWithAddOption";
import CategoryAutoCompleteWithAddOption from "@/apps/user/components/CategoryAutoCompleteWithAddOption";
import BrandAutoCompleteWithAddOption from "@/apps/user/components/BrandAutoCompleteWithAddOption";
import UnitAutoCompleteWithAddOption from "@/apps/user/components/UnitAutoCompleteWithAddOption";
import DoneByAutoCompleteWithAddOption from "@/apps/user/components/DoneByAutoCompleteWithAddOption";
import CostCenterAutoCompleteWithAddOption from "@/apps/user/components/CostCenterAutoCompleteWithAddOption";
import JsBarcode from "jsbarcode";
import PrintBarcodeButton from "@/components/PrintBarcodeButton";

import "./style.scss";

// --- UPDATED LIVE BARCODE PREVIEW COMPONENT ---
const LiveBarcodePreview = ({ value, options }) => {
  const barcodeRef = useRef(null);

  useEffect(() => {
    if (barcodeRef.current && value) {
      try {
        JsBarcode(barcodeRef.current, value, {
          format: "CODE128",
          displayValue: true, // This shows the number below the barcode lines
          // fontSize: 5,
          // height: 60, // Adjusted height
          // margin:0,
          // mwidth: 1,
        });
      } catch (e) {
        console.error("Barcode generation error:", e);
      }
    }
  }, [value, options]); // Re-run effect when options change to force re-render

  const formattedPrice = options.itemPrice ? parseFloat(options.itemPrice).toFixed(2) : '';

  return (
    <div className="live-barcode-preview">
      {options.showStore && options.storeName && <div className="store-name">{options.storeName}</div>}
      
      {(options.showName && options.itemName) || (options.showPrice && formattedPrice) ? (
        <div className="item-details">
          <span className="item-name">{options.showName && options.itemName ? options.itemName : ''}</span>
          <span className="item-price">{options.showPrice && formattedPrice ? `Price: ${formattedPrice}` : ''}</span>
        </div>
      ) : null}
      
      <svg ref={barcodeRef}></svg>
    </div>
  );
};


const AddItem = ({ isOpen, onClose, mode, selectedItem, onItemCreated }) => {
  const showToast = useToast();
  const nameRef = useRef(null);
  const descriptionRef = useRef(null);
  const categoryRef = useRef(null);
  const skuRef = useRef(null);
  const brandRef = useRef(null);
  const unitRef = useRef(null);
  const barcodeRef = useRef(null);
  const stockQuantityRef = useRef(null);
  const purchasePriceRef = useRef(null);
  const sellingPriceWithTaxRef = useRef(null);
  const taxRef = useRef(null);
  const minStockLevelRef = useRef(null);
  const partyIdRef = useRef(null);
  const fileInputRef = useRef(null);

  const defaultForm = {
    name: "",
    description: "",
    category_id: "",
    sku: "",
    brand_id: "",
    unit_id: "",
    bar_code: "",
    stock_quantity: "",
    purchase_price: "",
    selling_price_with_tax: "",
    tax: "",
    min_stock_level: "",
    party_id: "",
    image: "",
    done_by_id: "",
    cost_center_id: "",
  };

  const [form, setForm] = useState({ ...defaultForm });
  const [imageFile, setImageFile] = useState(null);
  const { data: printSettings } = useFetchPrintSettings();
  const [imagePreview, setImagePreview] = useState(null);
  const disabled = mode === "view";

  const [printOptions, setPrintOptions] = useState({
    showStore: true,
    showName: true,
    showPrice: true,
  });

  const { mutateAsync: createItem, isLoading: creating } = useCreateItem();
  const { mutateAsync: updateItem, isLoading: updating } = useUpdateItem();
  const { mutateAsync: deleteItem, isLoading: deleting } = useDeleteItem();

  useEffect(() => {
    if (isOpen) {
      setImageFile(null);
      setImagePreview(null);
      if (mode === "edit" || mode === "view") {
        setForm({ ...defaultForm, ...selectedItem });
        if (selectedItem?.image) {
          // setImagePreview(`${API_FILES}/uploads/${selectedItem.image}`);
         setImagePreview(`${API_FILES}/${selectedItem.image}`);

        }
      } else {
        const savedForm = localStorage.getItem("item_form");
        setForm(savedForm ? JSON.parse(savedForm) : { ...defaultForm, ...selectedItem });
      }
    }
    if (mode !== "view") {
      setTimeout(() => nameRef.current?.focus(), 100);
    }
  }, [isOpen, mode, selectedItem]);

  useEffect(() => {
    if (mode === "add") {
      localStorage.setItem("item_form", JSON.stringify(form));
    }
  }, [form, mode]);

  const clearLocalStorage = () => {
    localStorage.removeItem("item_form");
    setForm({ ...defaultForm });
  };

  const handleDelete = async () => {
    try {
      await deleteItem(selectedItem.id, {
        onSuccess: () => {
      onClose();
      clearLocalStorage();
        },
      });
      showToast({
        crudItem: CRUDITEM.ITEM,
        crudType: CRUDTYPE.DELETE_SUCCESS,
      });
    } catch (error) {
      showToast({
        crudItem: CRUDITEM.ITEM,
        crudType: CRUDTYPE.DELETE_ERROR,
      });
    }
  };

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setForm({ ...form, image: "" });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleGenerateBarcode = () => {
    const randomBarcode = Math.floor(
      100000000000 + Math.random() * 900000000000
    ).toString();
    setForm({ ...form, bar_code: randomBarcode });
  };

  const handleClearBarcode = () => {
    setForm({ ...form, bar_code: "" });
  };
  
  const handlePrintOptionChange = (e) => {
    const { name, checked } = e.target;
    setPrintOptions((prev) => ({ ...prev, [name]: checked }));
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: "Please enter an item name.",
        status: TOASTSTATUS.ERROR,
      });
      nameRef.current?.focus();
      return;
    }

    if (!form.category_id) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: "Please select a category.",
        status: TOASTSTATUS.ERROR,
      });
      categoryRef.current?.focus();
      return;
    }
    if (!form.sku) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: "Please enter a SKU.",
        status: TOASTSTATUS.ERROR,
      });
      skuRef.current?.focus();
      return;
    }
    if (!form.brand_id) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: "Please select a brand.",
        status: TOASTSTATUS.ERROR,
      });
      brandRef.current?.focus();
      return;
    }
    if (!form.unit_id) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: "Please select a unit.",
        status: TOASTSTATUS.ERROR,
      });
      unitRef.current?.focus();
      return;
    }
    if (!form.stock_quantity) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: "Please enter the stock quantity.",
        status: TOASTSTATUS.ERROR,
      });
      stockQuantityRef.current?.focus();
      return;
    }
    if (!form.purchase_price) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: "Please enter the purchase price.",
        status: TOASTSTATUS.ERROR,
      });
      purchasePriceRef.current?.focus();
      return;
    }
    if (!form.selling_price_with_tax) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: "Please enter the selling price with tax.",
        status: TOASTSTATUS.ERROR,
      });
      sellingPriceWithTaxRef.current?.focus();
      return;
    }
    if (!form.tax) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: "Please enter the tax percentage.",
        status: TOASTSTATUS.ERROR,
      });
      taxRef.current?.focus();
      return;
    }
    if (!form.min_stock_level) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: "Please enter the minimum stock level.",
        status: TOASTSTATUS.ERROR,
      });
      minStockLevelRef.current?.focus();
      return;
    }
    if (!form.party_id) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: "Please select a supplier.",
        status: TOASTSTATUS.ERROR,
      });
      partyIdRef.current?.focus();
      return;
    }
    try {
      const formData = new FormData();

      Object.keys(form).forEach((key) => {
        if (form[key] !== null && form[key] !== undefined) {
          formData.append(key, form[key]);
        }
      });

      if (imageFile) {
        formData.append("image", imageFile);
      }

      if (mode === "edit") {
        await updateItem(
          { id: selectedItem.id, data: formData },
          {
            onSuccess: () => {
              onClose();
            },
          }
        );
        showToast({
          crudItem: CRUDITEM.ITEM,
          crudType: CRUDTYPE.UPDATE_SUCCESS,
        });
      } else {
        const newItem = await createItem(formData);

        showToast({
          crudItem: CRUDITEM.ITEM,
          crudType: CRUDTYPE.CREATE_SUCCESS,
        });

        clearLocalStorage();
        onClose();

        if (onItemCreated) {
          onItemCreated(newItem);
        }
      }
      onClose();
    } catch (err) {
      const msg = err.response?.data?.error || "An unexpected error occurred.";
      showToast({
        type: TOASTTYPE.GENARAL,
        message: msg,
        status: TOASTSTATUS.ERROR,
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalHeader>
        <Title report={Report.Item} mode={mode} />
      </ModalHeader>
      <ModalBody>
        <InputField
        label="Item Name"
          disabled={disabled}
          ref={nameRef}
          name="name"
          type="text"
          placeholder="Item Name"
          value={form.name}
          onChange={handleChange}
          required
        />
        <TextArea
          label="Description"
          disabled={disabled}
          ref={descriptionRef}
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={handleChange}
          required
        />
        <CategoryAutoCompleteWithAddOption
          disabled={disabled}
          ref={categoryRef}
          name="category_id"
          placeholder="Category"
          value={form.category_id}
          onChange={handleChange}
          required
        />
        <InputField
          label="SKU"
          disabled={disabled}
          ref={skuRef}
          name="sku"
          placeholder="SKU"
          value={form.sku}
          onChange={handleChange}
          required
        />
        <BrandAutoCompleteWithAddOption
          disabled={disabled}
          ref={brandRef}
          name="brand_id"
          placeholder="Brand"
          value={form.brand_id}
          onChange={handleChange}
          required
        />
        <UnitAutoCompleteWithAddOption
          disabled={disabled}
          ref={unitRef}
          name="unit_id"
          placeholder="Unit"
          value={form.unit_id}
          onChange={handleChange}
          required
        />

        <div className="barcode-section">
          <div className="barcode-section__input-wrapper">
            <InputField
            label="Barcode (Optional)"
              disabled={disabled}
              ref={barcodeRef}
              name="bar_code"
              placeholder="Barcode (Optional)"
              value={form.bar_code}
              onChange={handleChange}
            />
          </div>
          {form.bar_code ? (
            <button
              type="button"
              onClick={handleClearBarcode}
              disabled={disabled}
              className="barcode-section__button barcode-section__button-clear"
            >
              Clear
            </button>
          ) : (
            <button
              type="button"
              onClick={handleGenerateBarcode}
              disabled={disabled}
              className="barcode-section__button barcode-section__button-generate"
            >
              Generate
            </button>
          )}
          <PrintBarcodeButton
            barcodeValue={form.bar_code}
            itemName={form.name}
            itemPrice={form.selling_price_with_tax}
            storeName={printSettings?.store}
            showStore={printOptions.showStore}
            showName={printOptions.showName}
            showPrice={printOptions.showPrice}
            disabled={!form.bar_code}
          />
        </div>

        {form.bar_code && (
          <div className="barcode-display-section">
            <div className="barcode-section__display">
              <div className="print-options-container">
                <label className="print-options-container__label">
                  <input
                    type="checkbox"
                    name="showStore"
                    checked={printOptions.showStore}
                    onChange={handlePrintOptionChange}
                    disabled={disabled}
                  />
                  Store Name
                </label>
                <label className="print-options-container__label">
                  <input
                    type="checkbox"
                    name="showName"
                    checked={printOptions.showName}
                    onChange={handlePrintOptionChange}
                    disabled={disabled}
                  />
                  Item Name
                </label>
                <label className="print-options-container__label">
                  <input
                    type="checkbox"
                    name="showPrice"
                    checked={printOptions.showPrice}
                    onChange={handlePrintOptionChange}
                    disabled={disabled}
                  />
                  Price
                </label>
              </div>
              <LiveBarcodePreview 
                value={form.bar_code} 
                options={{
                  ...printOptions,
                  itemName: form.name,
                  itemPrice: form.selling_price_with_tax,
                  storeName: printSettings?.store
                }} 
              />
            </div>
          </div>
        )}
        
        <InputField
        label="Stock Quantity"
          ref={stockQuantityRef}
          name="stock_quantity"
          placeholder="Stock Quantity"
          value={form.stock_quantity}
          onChange={handleChange}
          disabled={disabled}
          required
          type="number"
        />
        <InputField
        label="Purchase Price"
          ref={purchasePriceRef}
          name="purchase_price"
          placeholder="Purchase Price"
          value={form.purchase_price}
          onChange={handleChange}
          disabled={disabled}
          required
          type="number"
          step="0.01"
        />
        <InputField
        label="Selling Price (with Tax)"
          ref={sellingPriceWithTaxRef}
          name="selling_price_with_tax"
          placeholder="Selling Price (with Tax)"
          value={form.selling_price_with_tax}
          onChange={handleChange}
          disabled={disabled}
          required
          type="number"
          step="0.01"
        />
        <InputField
        label="Tax (%)"
          ref={taxRef}
          name="tax"
          placeholder="Tax (%)"
          value={form.tax}
          onChange={handleChange}
          disabled={disabled}
          required
          type="number"
          step="0.01"
        />
        <InputField
        label="Minimum Stock Level"
          ref={minStockLevelRef}
          name="min_stock_level"
          placeholder="Minimum Stock Level"
          value={form.min_stock_level}
          onChange={handleChange}
          disabled={disabled}
          required
          type="number"
        />
        <SupplierAutoCompleteWithAddOption
          ref={partyIdRef}
          name="party_id"
          placeholder="Select Supplier"
          value={form.party_id}
          onChange={handleChange}
          disabled={disabled}
          required
        />
        <DoneByAutoCompleteWithAddOption
          placeholder="Select Done By"
          name="done_by_id"
          value={form.done_by_id}
          onChange={handleChange}
          disabled={disabled}
        />
        <CostCenterAutoCompleteWithAddOption
          placeholder="Select Cost Center"
          name="cost_center_id"
          value={form.cost_center_id}
          onChange={handleChange}
          disabled={disabled}
        />

        <div className="image-upload-section">
          <div className="image-upload-section__content">
            {imagePreview ? (
              <div className="image-upload-section__preview">
                <img
                  src={imagePreview}
                  alt="Item Preview"
                  className="image-upload-section__image"
                />
                {!disabled && (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="image-upload-section__remove-button"
                  >
                    &times;
                  </button>
                )}
              </div>
            ) : (
              <div className="image-upload-section__placeholder">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={disabled}
                  className="image-upload-section__button"
                >
                  Choose Image
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/png, image/jpeg, image/gif"
                  style={{ display: "none" }}
                  disabled={disabled}
                />
              </div>
            )}
          </div>
        </div>
      </ModalBody>
      <ModalFooter
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "flex-end",
          gap: "16px",
        }}
      >
        {mode === "add" && <CancelButton onClick={onClose} />}
        {mode === "edit" && (
          <DeleteTextButton
            transaction={Transaction.Item}
            onDelete={handleDelete}
            isLoading={deleting}
          />
        )}
        <SubmitButton
          isLoading={creating || updating}
          disabled={disabled}
          type={mode}
          onClick={handleSubmit}
        />
      </ModalFooter>
    </Modal>
  );
};

export default AddItem;