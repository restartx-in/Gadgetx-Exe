import IconBackButton from '@/apps/user/components/IconBackButton'
import PageTitle from '@/components/PageTitle'
import './style.scss'

const PageTitleWithBackButton = ({ title, subtitle }) => {
  return (
    <div className="page_title_with_backbutton fs24 fw600">
      <IconBackButton />
      <PageTitle title={title} subtitle={subtitle} />
    </div>
  )
}

export default PageTitleWithBackButton