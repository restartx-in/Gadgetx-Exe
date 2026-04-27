import IconBackButton from "@/components/IconBackButton";
import PageTitle from "@/components/PageTitle";
import "./style.scss";

// Added subtitle prop
const PageTitleWithBackButton = ({ title, subtitle }) => {
  return (
    <div className="page_title_with_backbutton">
      <IconBackButton />
      <div className="title_container">
        <PageTitle title={title} />
        {subtitle && <span className="page_subtitle">{subtitle}</span>}
      </div>
    </div>
  );
};

export default PageTitleWithBackButton;