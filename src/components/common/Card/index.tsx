import React, { HTMLAttributes } from 'react'
import styled from 'styled-components'

import { BaseCard } from '../../pureStyledComponents/BaseCard'

const Title = styled.h2<{ titleAlign?: string }>`
  color: ${(props) => props.theme.cards.titleColor};
  font-size: 16px;
  font-weight: 700;
  line-height: 1.31;
  margin: 0;
  text-align: ${(props) => props.titleAlign};
`

Title.defaultProps = {
  titleAlign: 'left',
}

const Body = styled.div`
  color: ${(props) => props.theme.cards.textColor};
  display: flex;
  flex-direction: column;
  flex-grow: 1;
`

interface Props extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  noPadding?: boolean
  title?: string
  titleAlign?: string
}

export const Card: React.FC<Props> = (props: Props) => {
  const { children, noPadding, title, titleAlign, ...restProps } = props
  return (
    <BaseCard noPadding={noPadding} {...restProps}>
      {title ? <Title titleAlign={titleAlign}>{title}</Title> : null}
      <Body className="cardBody">{children}</Body>
    </BaseCard>
  )
}
