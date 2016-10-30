import xs from 'xstream';
import dropRepeats from 'xstream/extra/droprepeats';
import tinycolor from 'tinycolor2';
import { div } from '@cycle/dom';

import SaturationValue from './components/saturation-value';
import Hue from './components/hue';
import Alpha from './components/alpha';

// import view from './view';

function view ([state, saturationValue, hue, alpha]) {
  const swatch = div('.swatchy', {style: {
    width: '100px',
    height: '100px',
    background: tinycolor.fromRatio(state.color).toRgbString()
  }});

  return (
    div('.color-picker', [
      saturationValue,
      hue,
      alpha,
      swatch
    ])
  );
}

function updateColor (value) {
  return function _updateColor (state) {
    const newColor = Object.assign({}, state.color, value);

    return Object.assign({}, state, {color: newColor});
  };
}

function setStateFromProps (props) {
  return function _setStateFromProps (state) {
    if ('color' in props) {
      props.color = tinycolor(props.color).toHsv();
    }

    return {
      ...state,

      ...props
    };
  };
}

export default function ColorPicker ({DOM, props$ = xs.empty()}) {
  const initialState = {color: {h: 0, s: 0, v: 0, a: 0}};

  const saturationValueComponent$ = SaturationValue({DOM, props$});
  const hueComponent$ = Hue({DOM, props$});
  const alphaComponent$ = Alpha({DOM, props$});

  const setStateFromProps$ = props$
    .map(setStateFromProps);

  const alpha$ = alphaComponent$
    .alpha$
    .map(alpha => ({a: alpha}));

  const hue$ = hueComponent$
    .hue$
    .map(hue => ({h: hue}));

  const saturationValue$ = saturationValueComponent$
    .saturationValue$
    .map(saturationValue => ({s: saturationValue.saturation, v: saturationValue.value}));

  const colorParts$ = xs.merge(
    saturationValue$,
    hue$,
    alpha$
  ).map(value => updateColor(value));

  const action$ = xs.merge(
    colorParts$,
    setStateFromProps$
  );

  const state$ = action$
    .fold((state, action) => action(state), initialState)
    .compose(dropRepeats((a, b) => JSON.stringify(a) === JSON.stringify(b)))
    .remember();

  const color$ = state$
    .map(state => tinycolor.fromRatio(state.color).toRgbString());

  const DOM$ = xs.combine(
    state$,
    saturationValueComponent$.DOM,
    hueComponent$.DOM,
    alphaComponent$.DOM
  ).map(view);

  return {
    DOM: DOM$,
    color$
  };
}
