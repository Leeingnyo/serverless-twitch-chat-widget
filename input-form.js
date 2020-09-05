function InputForm(item) {
  var helpButton, helpModal;
  var input;
  var li = dom('li.form-list-item',
    dom('label',
      dom('span.label-text', item.label),
      dom('input.input', {
        type: item.type,
        placeholder: item.placeholder,
        title: item.placeholder,
        value: item.default,
        name: item.id,
        required: item.mandatory,
        ... (item.pattern && ({ pattern: item.pattern }))
      })
    ),
    !item.help ? null : [
      dom('label', { for: `${item.id}-help` }, dom('span', { style: { cursor: 'pointer', 'font-size': '0.7em', 'margin-left': '0.2em', },
          type: 'button', title: '도움말' }, '[도움말]-누르세요')),
      helpButton = dom('input.help', { type: 'checkbox', id: `${item.id}-help` }),
      helpModal = dom('div.help-modal')
    ]
  )
  if (item.help) {
    helpModal.innerHTML = item.help;
  }
  return li;
}