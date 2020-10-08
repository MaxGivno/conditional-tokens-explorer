import { useDebounceCallback } from '@react-hook/debounce'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import DataTable from 'react-data-table-component'
import styled from 'styled-components'

import { Button } from 'components/buttons'
import { ButtonControl, ButtonControlType } from 'components/buttons/ButtonControl'
import { Modal, ModalProps } from 'components/common/Modal'
import { TokenIcon } from 'components/common/TokenIcon'
import { ButtonContainer } from 'components/pureStyledComponents/ButtonContainer'
import { EmptyContentText } from 'components/pureStyledComponents/EmptyContentText'
import { SearchField } from 'components/search/SearchField'
import { InfoCard } from 'components/statusInfo/InfoCard'
import { InlineLoading } from 'components/statusInfo/InlineLoading'
import { TableControls } from 'components/table/TableControls'
import { TitleValue } from 'components/text/TitleValue'
import { Web3ContextStatus, useWeb3ConnectedOrInfura } from 'contexts/Web3Context'
import { PositionWithUserBalanceWithDecimals, usePositions } from 'hooks'
import { usePositionsSearchOptions } from 'hooks/usePositionsSearchOptions'
import { customStyles } from 'theme/tableCustomStyles'
import { getLogger } from 'util/logger'
import { truncateStringInTheMiddle } from 'util/tools'

const Search = styled(SearchField)`
  min-width: 0;
  width: 400px;
`

const logger = getLogger('PositionsListModal')

interface Props extends ModalProps {
  isOpen: boolean
  onConfirm?: (positions: Array<PositionWithUserBalanceWithDecimals>) => void
  onRequestClose?: () => void
  preSelectedPositions?: string[]
  showOnlyPositionsWithBalance?: boolean
  singlePosition?: boolean
}

export const SelectPositionModal: React.FC<Props> = (props) => {
  const {
    onConfirm,
    preSelectedPositions,
    showOnlyPositionsWithBalance,
    singlePosition,
    ...restProps
  } = props
  const { _type: status } = useWeb3ConnectedOrInfura()
  const [selectedPositions, setSelectedPositions] = useState<
    Array<PositionWithUserBalanceWithDecimals>
  >([])
  const [positionIdToSearch, setPositionIdToSearch] = useState<string>('')
  const [positionIdToShow, setPositionIdToShow] = useState<string>('')
  const [positionList, setPositionList] = useState<PositionWithUserBalanceWithDecimals[]>([])

  const debouncedHandlerPositionIdToSearch = useDebounceCallback((positionIdToSearch) => {
    setPositionIdToSearch(positionIdToSearch)
  }, 500)

  const onChangePositionId = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = event.currentTarget
      setPositionIdToShow(value)
      debouncedHandlerPositionIdToSearch(value)
    },
    [debouncedHandlerPositionIdToSearch]
  )

  const onClearSearch = React.useCallback(() => {
    setPositionIdToShow('')
    debouncedHandlerPositionIdToSearch('')
  }, [debouncedHandlerPositionIdToSearch])

  const { data, error, loading } = usePositions({
    positionId: positionIdToSearch,
  })

  // Filter preselectedPositions (stringIds[]) from data to merge with currently selected positions.
  useEffect(() => {
    if (data && data.length && preSelectedPositions && preSelectedPositions.length) {
      setSelectedPositions((current: Array<PositionWithUserBalanceWithDecimals>) => {
        const currentIds = current.map(({ id }) => id)
        const filteredPre = preSelectedPositions.filter((pre) => !currentIds.includes(pre))
        const dataFiltered = data.filter(({ id }) => filteredPre.includes(id))
        return [...current, ...dataFiltered]
      })
    }
  }, [preSelectedPositions, data])

  // Filter selected positions from original list. And positions without balance as indicated by props.
  useEffect(() => {
    if (data) {
      const selectedPositionsIds = selectedPositions.map(({ id }) => id)
      const positionsNotSelected = data.filter(({ id }) => !selectedPositionsIds.includes(id))
      const positionsNotSelectedFiltered = showOnlyPositionsWithBalance
        ? positionsNotSelected.filter((position) => !position.userBalanceERC1155.isZero())
        : positionsNotSelected
      setPositionList(positionsNotSelectedFiltered)
    }
  }, [selectedPositions, data, showOnlyPositionsWithBalance])

  const handleMultiAddClick = useCallback((position: PositionWithUserBalanceWithDecimals) => {
    setSelectedPositions((current) => {
      const included = current.find((selected) => selected.id === position.id)
      return included ? current : [...current, position]
    })
  }, [])

  const handleSingleAddClick = useCallback((position: PositionWithUserBalanceWithDecimals) => {
    setSelectedPositions([position])
  }, [])

  const handleRemoveClick = useCallback((position: PositionWithUserBalanceWithDecimals) => {
    setSelectedPositions((current) => {
      return current.filter((selected) => selected.id !== position.id)
    })
  }, [])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const defaultColumns: Array<any> = useMemo(
    () => [
      {
        // eslint-disable-next-line react/display-name
        cell: (row: PositionWithUserBalanceWithDecimals) => truncateStringInTheMiddle(row.id, 8, 6),
        maxWidth: '170px',
        name: 'Position Id',
        selector: 'createTimestamp',
        sortable: true,
      },
      {
        // eslint-disable-next-line react/display-name
        cell: (row: PositionWithUserBalanceWithDecimals) => {
          return row.token ? <TokenIcon token={row.token} /> : row.collateralToken
        },
        maxWidth: '140px',
        minWidth: '140px',
        name: 'Collateral',
        selector: 'collateralToken',
        sortable: true,
      },
    ],
    []
  )

  const addCell = useMemo(
    () => ({
      name: '',
      button: true,
      ignoreRowClick: true,
      maxWidth: '36px',
      minWidth: '36px',
      // eslint-disable-next-line react/display-name
      cell: (row: PositionWithUserBalanceWithDecimals) => (
        <ButtonControl
          buttonType={ButtonControlType.add}
          disabled={!!(singlePosition && selectedPositions.length)}
          onClick={() => (singlePosition ? handleSingleAddClick(row) : handleMultiAddClick(row))}
        />
      ),
    }),
    [singlePosition, handleSingleAddClick, handleMultiAddClick, selectedPositions]
  )

  const deleteCell = useMemo(
    () => ({
      name: '',
      button: true,
      ignoreRowClick: true,
      maxWidth: '36px',
      minWidth: '36px',
      // eslint-disable-next-line react/display-name
      cell: (row: PositionWithUserBalanceWithDecimals) => (
        <ButtonControl
          buttonType={ButtonControlType.delete}
          onClick={() => handleRemoveClick(row)}
        />
      ),
    }),
    [handleRemoveClick]
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [connectedItems, setConnectedItems] = useState<Array<any>>([])

  useEffect(() => {
    if (status === Web3ContextStatus.Connected) {
      setConnectedItems([
        {
          // eslint-disable-next-line react/display-name
          cell: (row: PositionWithUserBalanceWithDecimals) => (
            <span
              {...(row.userBalanceERC1155WithDecimals
                ? { title: row.userBalanceERC1155.toString() }
                : {})}
            >
              {row.userBalanceERC1155WithDecimals}
            </span>
          ),
          name: 'ERC1155 Amount',
          right: true,
          selector: 'userBalanceERC1155Numbered',
          sortable: true,
        },
      ])
    }
  }, [status])

  const getPositionsColumns = useCallback(() => {
    return [...defaultColumns, ...connectedItems, addCell]
  }, [connectedItems, defaultColumns, addCell])

  const getSelectedColumns = useCallback(() => {
    return [
      ...defaultColumns.map((col) => ({ ...col, sortable: false })),
      ...connectedItems.map((col) => ({ ...col, sortable: false })),
      deleteCell,
    ]
  }, [defaultColumns, connectedItems, deleteCell])

  const handleDone = useCallback(() => {
    if (selectedPositions.length && onConfirm && typeof onConfirm === 'function') {
      onConfirm(selectedPositions)
    }
  }, [onConfirm, selectedPositions])

  const isLoading = !positionIdToSearch && loading
  const isSearching = positionIdToSearch && loading
  const showSpinner = (isLoading || isSearching) && !error

  const [searchBy, setSearchBy] = useState('all')
  const dropdownItems = usePositionsSearchOptions(setSearchBy)

  logger.log(`Search by ${searchBy}`)

  return (
    <Modal
      subTitle={singlePosition ? 'Select one position.' : 'Select multiple positions.'}
      title={'Select Position'}
      {...restProps}
    >
      <TableControls
        end={
          <Search
            dropdownItems={dropdownItems}
            onChange={onChangePositionId}
            onClear={onClearSearch}
            value={positionIdToShow}
          />
        }
      />
      {error && !isLoading && <InfoCard message={error.message} title="Error" />}
      {!error && (
        <DataTable
          className="outerTableWrapper inlineTable"
          columns={getPositionsColumns()}
          customStyles={customStyles}
          data={showSpinner ? [] : positionList.length ? positionList : []}
          noDataComponent={
            showSpinner ? (
              <InlineLoading size="30px" />
            ) : (
              <EmptyContentText>{`No positions ${
                showOnlyPositionsWithBalance && data && data.length ? ' with balance' : ''
              } found.`}</EmptyContentText>
            )
          }
          noHeader
          pagination
          paginationPerPage={5}
          paginationRowsPerPageOptions={[5, 10, 15]}
          responsive
        />
      )}
      <TitleValue
        title={singlePosition ? 'Selected Position' : 'Selected Positions'}
        value={
          <DataTable
            className="outerTableWrapper inlineTable"
            columns={getSelectedColumns()}
            customStyles={customStyles}
            data={selectedPositions}
            noDataComponent={<EmptyContentText>No positions selected.</EmptyContentText>}
            noHeader
            responsive
          />
        }
      />
      <ButtonContainer>
        <Button disabled={!selectedPositions.length} onClick={handleDone}>
          Done
        </Button>
      </ButtonContainer>
    </Modal>
  )
}
