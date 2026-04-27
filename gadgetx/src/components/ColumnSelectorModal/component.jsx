import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Modal, ModalHeader, ModalFooter, ModalBody } from "@/components/Modal";
import CancelButton from "@/components/CancelButton";
import Button from "@/components/Button";
import ColumnSelectorButton from "@/components/ColumnSelectorButton";
import "./style.scss";

const ArrowIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M13.167 6.50401L18.496 11.401C18.848 11.724 18.848 12.276 18.496 12.599L13.167 17.496C12.662 17.961 11.838 17.616 11.838 16.947V13H5.5C4.948 13 4.5 12.552 4.5 12C4.5 11.448 4.948 11 5.5 11H11.838V7.05301C11.838 6.38401 12.662 6.03901 13.167 6.50401Z"
      fill="#A0AEC0"
    />
  </svg>
);

const DraggableItem = ({ item, index }) => (
  <Draggable key={item.value} draggableId={String(item.value)} index={index}>
    {(provided, snapshot) => (
      <div
        ref={provided.innerRef}
        {...provided.draggableProps}
        {...provided.dragHandleProps}
        className={`draggable-item ${snapshot.isDragging ? "dragging" : ""}`}
      >
        {item.label}
      </div>
    )}
  </Draggable>
);

const DroppableColumn = ({ droppableId, title, items }) => (
  <Droppable droppableId={droppableId}>
    {(provided, snapshot) => (
      <div
        {...provided.droppableProps}
        ref={provided.innerRef}
        className={`droppable-column ${snapshot.isDraggingOver ? "dragging-over" : ""}`}
      >
        <h4 className="column-title">
          {title} ({items.length})
        </h4>
        <div className="items-container">
          {items.map((item, index) => (
            <DraggableItem key={item.value} item={item} index={index} />
          ))}
          {provided.placeholder}
          {items.length === 0 && (
            <p className="no-items-text">Drag columns here</p>
          )}
        </div>
      </div>
    )}
  </Droppable>
);

const ColumnSelectorModal = ({
  onApply,
  allPossibleFields = [],
  savedColumnKeys = [],
  isLoading = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [fields, setFields] = useState([]);

  useEffect(() => {
    if (isOpen) {
      const fieldMap = new Map(
        allPossibleFields.map((field) => [field.value, field]),
      );
      const selected = savedColumnKeys
        .map((key) => fieldMap.get(key))
        .filter(Boolean)
        .map((field) => ({ ...field, show: true }));
      const available = allPossibleFields
        .filter((field) => !savedColumnKeys.includes(field.value))
        .map((field) => ({ ...field, show: false }));
      setFields([...selected, ...available]);
    }
  }, [isOpen, allPossibleFields, savedColumnKeys]);

  const onDragEnd = (result) => {
    const { source, destination } = result;
    if (!destination) return;

    const currentFields = [...fields];
    const availableList = currentFields.filter((f) => !f.show);
    const selectedList = currentFields.filter((f) => f.show);

    let sourceList =
      source.droppableId === "selected" ? selectedList : availableList;
    let destList =
      destination.droppableId === "selected" ? selectedList : availableList;

    const [movedItem] = sourceList.splice(source.index, 1);

    if (source.droppableId !== destination.droppableId) {
      movedItem.show = !movedItem.show;
    }

    destList.splice(destination.index, 0, movedItem);

    setFields([...selectedList, ...availableList]);
  };

  const handleApply = () => {
    const selectedKeys = fields.filter((f) => f.show).map((f) => f.value);
    onApply(selectedKeys, () => setIsOpen(false));
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <>
      <ColumnSelectorButton onClick={() => setIsOpen(true)} />

      <Modal isOpen={isOpen} onClose={handleClose} size="2xl">
        <ModalHeader onClose={handleClose}>
          <h2>Customize Table Columns</h2>
        </ModalHeader>
        <ModalBody>
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="column-drag-area">
              <DroppableColumn
                droppableId="available"
                title="Available Columns"
                items={fields.filter((f) => !f.show)}
              />

              <div className="column-separator">
                <ArrowIcon />
              </div>

              <DroppableColumn
                droppableId="selected"
                title="Selected Columns"
                items={fields.filter((f) => f.show)}
              />
            </div>
          </DragDropContext>
        </ModalBody>
        <ModalFooter
          className="modal-footer-custom"
          style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}
        >
          <CancelButton onClick={handleClose} />
          <button onClick={handleApply} className="submit_button2">
            {isLoading ? (
              <span className="submit_button2-loader"></span>
            ) : (
              <span className="submit_button2-text fs18 fw500 ">Apply</span>
            )}
          </button>
        </ModalFooter>
      </Modal>
    </>
  );
};

export default ColumnSelectorModal;
