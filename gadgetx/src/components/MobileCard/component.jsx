import ActionsMenu from "@/components/ActionsMenu";
import HStack from "@/components/HStack";
import VStack from "@/components/VStack";
import "./style.scss";

const MobileCard = ({
  className,
  onView,
  onEdit,
  onDelete,
  title,
  line1Left,
  line1Right,
  line2Left,
  line2Right,
  line3Left,
  line3Right,
}) => {
  return (
    <div
      className={`card_container ${className || ""}`}
      onClick={onView}
      role="button"
      tabIndex={0}
    >
      <VStack gap="0px">
        <HStack justifyContent="space-between">
          <div className="card_container-title fs20 fw600">{title}</div>

          <div onClick={(e) => e.stopPropagation()}>
            <ActionsMenu onView={onView} onEdit={onEdit} onDelete={onDelete} />
          </div>
        </HStack>

        <HStack
          className="card_container__line fs18 fw400"
          justifyContent="space-between"
        >
          <span>{line1Left}</span>
          <span>{line1Right}</span>
        </HStack>

        <HStack
          className="card_container__line fs18 fw400"
          justifyContent="space-between"
        >
          <span>{line2Left}</span>
          <span>{line2Right}</span>
        </HStack>

        <HStack
          className="card_container__line fs18 fw400"
          justifyContent="space-between"
        >
          <span>{line3Left}</span>
          <span>{line3Right}</span>
        </HStack>
      </VStack>
    </div>
  );
};

export default MobileCard;
