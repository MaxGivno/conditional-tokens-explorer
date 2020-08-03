import { css } from 'styled-components'

export const CommonDisabledCSS = css`
  &.disabled,
  &.disabled:hover,
  &:disabled,
  &:disabled:hover,
  &[disabled],
  &[disabled]:hover {
    background-color: ${(props) => props.theme.form.disabled.backgroundColor};
    border-color: ${(props) => props.theme.form.disabled.borderColor};
    color: ${(props) => props.theme.form.disabled.color};
    cursor: not-allowed !important;
    user-select: none !important;
  }
`
