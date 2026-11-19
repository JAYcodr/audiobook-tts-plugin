import { PANEL_ID } from './constants.js'
import { Panel } from './components/Panel.jsx'
import { PanelGlyph } from './components/Primitives.jsx'

export default {
  inject: ['slots'],
  apply(ctx) {
    ctx.slots.inject('main', () => ctx.slots.register({ name: 'main', key: PANEL_ID }, Panel))

    ctx.slots.inject('sidebar.panellist', () => ctx.slots.register(
      { name: 'sidebar.panellist', id: PANEL_ID, order: 40, label: () => '听书值守' },
      PanelGlyph,
    ))
  },
}
