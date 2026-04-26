// src/apps/user/pages/RegisterSession/component.jsx

import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AmountSymbol from '@/components/AmountSymbol'
import useRegisterSessionById from '@/hooks/api/registerSession/useRegisterSessionById'
import ContainerWrapper from '@/components/ContainerWrapper'
import ScrollContainer from '@/components/ScrollContainer'
import PageTitle from '@/components/PageTitle'
import IconBackButton from '@/apps/user/components/IconBackButton'
import Loader from '@/components/Loader'
import HStack from '@/components/HStack'
import InputField from '@/components/InputField'
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Td,
  Th,
} from '@/components/Table'
import TextBadge from '@/apps/user/components/TextBadge'

import './style.scss'

// --- HELPER TO MATCH BACKEND DATE FORMAT ---
const formatDate = (dateInput) => {
  if (!dateInput) return '-';
  const date = new Date(dateInput);
  
  // Ensures YYYY-MM-DD HH:mm:ss format
  const pad = (n) => n.toString().padStart(2, '0');
  const YYYY = date.getFullYear();
  const MM = pad(date.getMonth() + 1);
  const DD = pad(date.getDate());
  const HH = pad(date.getHours());
  const mm = pad(date.getMinutes());
  const ss = pad(date.getSeconds());

  return `${YYYY}-${MM}-${DD} ${HH}:${mm}:${ss}`;
};

const RegisterSession = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  // Fetch Register Session Data
  const { data, isLoading, isError } = useRegisterSessionById(id)

  const handleBack = () => navigate('/register-sessions-report')

  if (isLoading) return <Loader />
  
  if (isError || !data) {
      return (
          <ContainerWrapper>
              <div className="p-4 text-center">Session not found.</div>
              <button className="btn btn-primary" onClick={handleBack}>Go Back</button>
          </ContainerWrapper>
      )
  }

  const { session, stats, reconciliation } = data;
  const { closed_at } = session;
  const isClosed = session.status === 'closed';

  const endDate = closed_at ? closed_at : (() => {
    const now = new Date();
    const pad = (n) => n.toString().padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  })();

  const statsRows = [
      { label: 'Opening Cash', amount: session.opening_cash, type: 'neutral' },
      { label: 'Total Sales', amount: stats.sales_total, type: 'plus' },
      { label: 'Total Sale Returns', amount: stats.sale_return_total, type: 'minus' },
      { label: 'Total Purchases', amount: stats.purchase_total, type: 'minus' },
      { label: 'Total Purchase Returns', amount: stats.purchase_return_total, type: 'plus' },
      
      { label: 'Cash In (Ledger)', amount: stats.cash_in, type: 'plus' }, 
      { label: 'Cash Out (Ledger)', amount: stats.cash_out, type: 'minus' },
      { label: 'Cash Balance', amount: stats.closing_cash_balance, type: 'neutral' },
      { label: 'Account Balance', amount: stats.closing_bank_balance, type: 'neutral' },
      
  ];

  return (
    <ContainerWrapper className="sale-page">
      <div className="sale-page__header">
        <IconBackButton onClick={handleBack} />
        <PageTitle title={`Register Session #${session.id}`} />
        <TextBadge variant="paymentStatus" type={isClosed ? 'Paid' : 'Partial'}>
            {session.status.toUpperCase()}
        </TextBadge>
      </div>

      <ScrollContainer>
        <div className="sale-page__form-content">
          
          {/* Top Details */}
          <div className="sale-page__top-controls fs16 fw600">
            <InputField label="Opened At" value={formatDate(session.opened_at)} readOnly />
            <InputField label="Closed At" value={formatDate(endDate)} readOnly />
            <InputField label="Done By" value={session.done_by_name || 'N/A'} readOnly />
            <InputField label="Cost Center" value={session.cost_center_name || 'N/A'} readOnly />
          </div>

          <div className="sale-page__payments-panel-top fs16 fw600">
             <HStack spacing={4}>
                <InputField label="Opening Note" value={session.opening_note || '-'} readOnly />
                <InputField label="Closing Note" value={session.closing_note || '-'} readOnly />
             </HStack>
          </div>

          {/* Breakdown Table */}
          <div className="sale-page__order-table">
            <div className="section-title mb-2 fs16 fw600">Session Breakdown</div>
            <Table>
              <Thead>
                <Tr>
                  <Th>DESCRIPTION</Th>
                  <Th>AMOUNT</Th>
                </Tr>
              </Thead>
              <Tbody>
                {statsRows.map((row, index) => (
                    <Tr key={index}>
                      <Td>{row.label}</Td>
                      <Td><AmountSymbol>{row.amount}</AmountSymbol></Td>
                    </Tr>
                ))}
              </Tbody>
            </Table>
          </div>

        </div>
      </ScrollContainer>

      {/* Bottom Summary */}
      <div className="sale-page__bottom-section">
        <div className="sale-page__summary-panel fs16 fw600" style={{borderLeft: 'none', width: '100%'}}>
          <HStack justifyContent="space-between" className="total-row">
            <span className="total-label">Expected Closing Cash</span>
            <span className="total-value"><AmountSymbol>{reconciliation.expected_closing_cash}</AmountSymbol></span>
          </HStack>
          
          {isClosed && (
              <>
                <HStack justifyContent="space-between" className="total-row">
                    <span className="total-label">Actual Closing Cash</span>
                    <span className="total-value"><AmountSymbol>{session.closing_cash}</AmountSymbol></span>
                </HStack>
                <div className="divider" />
                <HStack justifyContent="space-between" className="total-row">
                    <span className="total-label">Difference</span>
                    <span className={`total-value ${reconciliation.discrepancy === 0 ? 'text-success' : 'text-danger'}`}>
                        <AmountSymbol>{reconciliation.discrepancy}</AmountSymbol>
                    </span>
                </HStack>
              </>
          )}
        </div>
      </div>
    </ContainerWrapper>
  )
}

export default RegisterSession