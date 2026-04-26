import useAccounts from '@/hooks/api/account/useAccounts';  
import Select from '@/components/Select'; 
import './style.scss';

const AccountSelect = ({
  name,
  value,
  onChange,
  label,
  placeholder = 'Select an Account',
  required = false,
  disabled = false,
  className = '',
  filters = {},  
}) => {
  const { data: accounts, isLoading, isError, error } = useAccounts(filters);

  if (isLoading) {
    return (
      <div className={`custom_select_wrapperr ${className}`}>
        {label && <label className="custom_select_label">{label}</label>}
        <div className="custom_select_headerr disabled">
          <span className="custom_select_headerr_title">Loading accounts...</span>
        </div>
      </div>
    );  
  }

  if (isError) {
    console.error('Failed to load accounts:', error);
    return (
       <div className={`custom_select_wrapperr ${className}`}>
        {label && <label className="custom_select_label">{label}</label>}
        <div className="custom_select_headerr disabled error">
          <span className="custom_select_headerr_title">Error loading accounts</span>
        </div>
      </div>
    );
  }

  const accountOptions = (accounts || []).map((account) => ({
    value: account.id,
    label: `${account.name} (${account.type})`,  
  }));

  return (
    <Select
      name={name}
      value={value}
      onChange={onChange}
      options={accountOptions}
      label={label}
      placeholder={placeholder}
      required={required}
      disabled={disabled || isLoading}
      className={`account_select ${className}`}
    />
  );
};

export default AccountSelect;