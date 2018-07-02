import './styles.scss'
import React from 'react'
import { UniqueIndex } from 'utils/base'

const defaultAccepts = {
  'image': 'image/png,image/jpeg,image/gif,image/webp,image/apng,image/svg',
  'video': 'video/mp4',
  'audio': 'audio/mp3'
}

export default class BraftFinderView extends React.Component {

  static defaultProps = {
    accepts: {
      image: true,
      video: true,
      audio: true,
      embed: true
    },
    externals: {
      image: true,
      video: true,
      audio: true,
      embed: true
    }
  }

  constructor (props) {

    super(props)

    this.state = {
      draging: false,
      error: false,
      confirmable: false,
      external: {
        url: '',
        type: 'IMAGE'
      },
      showExternalForm: false,
      allowExternal: false,
      items: []
    }

    this.dragCounter = 0
    this.controller = this.props.controller

    this.changeListenerId = this.controller.onChange(items => {
      this.setState({ items, confirmable: items.filter(({ selected }) => selected).length })
      this.props.onChange && this.props.onChange(items)
    })

  }

  mapPropsToState (props) {

    const { accepts, externals } = props

    const fileAccept = !accepts ? [
      defaultAccepts.image, defaultAccepts.video, defaultAccepts.audio
    ].join(',') : [
      accepts.image ? (accepts.image.accept || defaultAccepts.image) : '',
      accepts.video ? (accepts.image.accept || defaultAccepts.video) : '',
      accepts.audio ? (accepts.image.accept || defaultAccepts.audio) : ''
    ].join(',')

    const external = {
      url: '',
      type: 
        externals.image ? 'IMAGE' :
        externals.audio ? 'AUDIO' :
        externals.video ? 'VIDEO' :
        externals.embed ? 'EMBED' : ''
    }

    return {
      fileAccept: fileAccept,
      external: external,
      allowExternal: externals && (externals.image || externals.audio || externals.video || externals.embed)
    }

  }

  componentDidMount () {

    this.setState(this.mapPropsToState(this.props))

  }

  componentWillReceiveProps (nextProps) {
    this.setState(this.mapPropsToState(nextProps))
  }

  componentWillUnmount () {
    this.controller.offChange(this.changeListenerId)
  }

  render () {

    const { language, externals, accepts } = this.props
    const { items, draging, confirmable, external, showExternalForm, allowExternal } = this.state

    return (
      <div className="braft-finder">
        <div
          onDragEnter={this.handleDragEnter}
          onDragLeave={this.handleDragLeave}
          onDrop={this.handleDragDrop}
          className="bf-uploader"
        >
          <div className={"bf-drag-uploader " + (draging || !items.length ? 'active ' : ' ') + (draging ? 'draging' : '')}>
            <span className="bf-drag-tip">
              <input accept={this.fileAccept} onChange={this.reslovePickedFiles} multiple type="file"/>
              {draging ? language.dropTip : language.dragTip}
            </span>
          </div>
          {items.length ? (
            <div className="bf-list-wrap">
              <div className="bf-list-tools">
                <span onClick={this.controller.selectAllItems} className="bf-select-all"><i className="braft-icon-done"></i> {language.selectAll}</span>
                <span onClick={this.controller.deselectAllItems} disabled={!confirmable} className="bf-deselect-all"><i className="braft-icon-close"></i> {language.deselect}</span>
                <span onClick={this.removeSelectedItems} disabled={!confirmable} className="bf-remove-selected"><i className="braft-icon-bin"></i> {language.removeSelected}</span>
              </div>
              {this.buildMediaList()}
            </div>
          ) : null}
          {showExternalForm && allowExternal ? (
            <div className="bf-add-external">
              <div className="bf-external-form">
                <div className="bf-external-input">
                  <div>
                    <input onKeyDown={this.confirmAddExternal} value={external.url} onChange={this.inputExternal} placeholder={language.externalInputPlaceHolder}/>
                  </div>
                  <button type="button" onClick={this.confirmAddExternal} disabled={!external.url.trim().length}>{language.confirm}</button>
                </div>
                <div data-type={external.type} className="bf-switch-external-type">
                  {externals.image ? <button type="button" onClick={this.switchExternalType} data-type="IMAGE">{language.image}</button> : null}
                  {externals.audio ? <button type="button" onClick={this.switchExternalType} data-type="AUDIO">{language.audio}</button> : null}
                  {externals.video ? <button type="button" onClick={this.switchExternalType} data-type="VIDEO">{language.video}</button> : null}
                  {externals.embed ? <button type="button" onClick={this.switchExternalType} data-type="EMBED">{language.embed}</button> : null}
                </div>
                <span className="bf-external-tip">{language.externalInputTip}</span>
              </div>
            </div>
          ) : null}
        </div>
        <footer className="bf-manager-footer">
          <div className="pull-left">
            {allowExternal ? (
              <span 
                onClick={this.toggleExternalForm}
                className="bf-toggle-external-form"
              >
                {showExternalForm ? (
                  <span className="bf-bottom-text"><i className="braft-icon-add"></i> {language.addLocalFile}</span>
                ) : (
                  <span className="bf-bottom-text"><i className="braft-icon-add"></i> {language.addExternalSource}</span>
                )}
              </span>
            ) : null}
          </div>
          <div className="pull-right">
            <button onClick={this.confirmInsert} className="button button-insert" disabled={!confirmable}>{language.insert}</button>
            <button onClick={this.cancelInsert} className="button button-cancel">{language.cancel}</button>
          </div>
        </footer>
      </div>
    )

  }

  buildMediaList () {

    return (
      <ul className="bf-list">
        <li className="bf-add-item">
          <i className="braft-icon-add"></i>
          <input accept={this.fileAccept} onChange={this.reslovePickedFiles} multiple type="file"/>
        </li>
        {this.state.items.map((item, index) => {

          let previewerComponents = null
          let progressMarker = item.uploading && !this.props.hideProgress ? (
            <div className="bf-item-uploading">
              <div className="bf-item-uploading-bar" style={{width: item.uploadProgress / 1 + '%'}}></div>
            </div>
          ) : ''

          switch (item.type) {
            case 'IMAGE': 
              previewerComponents = (
                <div className="bf-image">
                  {progressMarker}
                  <img src={item.thumbnail || item.url} />
                </div>
              )
            break
            case 'VIDEO':
              previewerComponents = (
                <div className="bf-icon bf-video" title={item.url}>
                  {progressMarker}
                  <i className="braft-icon-film"></i>
                  <span>{item.name || item.url}</span>
                </div>
              )
            break
            case 'AUDIO':
              previewerComponents = (
                <div className="bf-icon bf-audio" title={item.url}>
                  {progressMarker}
                  <i className="braft-icon-music"></i>
                  <span>{item.name || item.url}</span>
                </div>
              )
            break
            case 'EMBED':
              previewerComponents = (
                <div className="bf-icon bf-embed" title={item.url}>
                  {progressMarker}
                  <i className="braft-icon-code"></i>
                  <span>{item.name || this.props.language.embed}</span>
                </div>
              )
            break
            default:
              previewerComponents = (
                <a className="bf-icon bf-file" title={item.url} href={item.url}>
                  {progressMarker}
                  <i className="braft-icon-file-text"></i>
                  <span>{item.name || item.url}</span>
                </a>
              )
            break 
          }

          let className = ['bf-item']
          item.selected && className.push('active')
          item.uploading && className.push('uploading')
          item.error && className.push('error')

          return (
            <li
              key={index}
              title={item.name}
              data-id={item.id}
              className={className.join(' ')}
              onClick={this.toggleSelectItem}
            >
              {previewerComponents}
              <span data-id={item.id} onClick={this.removeItem} className="bf-item-remove braft-icon-close"></span>
              <span className="bf-item-title">{item.name}</span>
            </li>
          )

        })}
      </ul>
    )

  }

  toggleSelectItem = (event) => {

    const itemId = event.currentTarget.dataset.id
    const item = this.controller.getMediaItem(itemId)

    if (!item) {
      return false
    }

    if (item.selected) {

      if (!this.props.onBeforeDeselect || this.props.onBeforeDeselect([item], this.controller.getItems()) !== false) {
        this.controller.deselectMediaItem(itemId)
        this.props.onDeselect && this.props.onDeselect([item], this.controller.getItems())
      }

    } else {

      if (!this.props.onBeforeSelect || this.props.onBeforeSelect([item], this.controller.getItems()) !== false) {
        this.controller.selectMediaItem(itemId)
        this.props.onSelect && this.props.onSelect([item], this.controller.getItems())
      }

    }

  }

  removeItem = (event) => {

    const itemId = event.currentTarget.dataset.id
    const item = this.controller.getMediaItem(itemId)

    if (!item) {
      return false
    }

    if (!this.props.onBeforeRemove || this.props.onBeforeRemove([item], this.controller.getItems()) !== false) {
      this.controller.removeMediaItem(itemId)
      this.props.onRemove && this.props.onRemove([item], this.controller.getItems())
    }

    event.stopPropagation()

  }

  removeSelectedItems = () => {

    const selectedItems = this.controller.getSelectedItems()

    if (!this.props.onBeforeRemove || this.props.onBeforeRemove(selectedItems, this.controller.getItems()) !== false) {
      this.controller.removeSelectedItems()
      this.props.onRemove && this.props.onRemove(selectedItems, this.controller.getItems())
    }

  }

  handleDragLeave = (event) => {
    this.dragCounter --
    this.dragCounter === 0 && this.setState({
      draging: false
    })
  }

  handleDragDrop = (event) => {
    this.dragCounter = 0
    this.setState({ draging: false })
  }

  handleDragEnter = (event) => {
    e.preventDefault()
    this.dragCounter ++
    this.setState({ draging: true })
  }

  reslovePickedFiles = (event) => {

    event.persist()

    this.controller.resolveFiles({
      files: event.target.files,
      onItemReady: ({ id }) => this.controller.selectMediaItem(id),
      onAllReady: () => event.target.value = null
    }, 0, this.props.accepts)

  }

  inputExternal = (event) => {
    this.setState({
      external: {
        ...this.state.external,
        url: event.target.value
      }
    })
  }

  switchExternalType = (event) => {
    this.setState({
      external: { ...this.state.external, type: event.target.dataset.type }
    })
  }

  confirmAddExternal = (event) => {

    if (event.target.nodeName.toLowerCase() === 'button' || event.keyCode === 13) {

      let { url, type } = this.state.external
      url = url.split('|')
      let name = url.length > 1 ? url[0] : this.props.language.unnamedItem
      url = url.length > 1 ? url[1] : url[0]
      let thumbnail = type === 'IMAGE' ? url : null

      this.controller.addItems([{
        thumbnail, url, name, type,
        id: new Date().getTime() + '_' + UniqueIndex(),
        uploading: false,
        uploadProgress: 1,
        selected: true
      }])

      this.setState({
        showExternalForm: false,
        external: {
          url: '',
          type: 'IMAGE'
        }
      })

    }

  }

  toggleExternalForm = () => {
    this.setState({
      showExternalForm: !this.state.showExternalForm,
    })
  }

  cancelInsert = () => {
    this.props.onCancel && this.props.onCancel()
  }

  confirmInsert = () => {

    const selectedItems = this.controller.getSelectedItems()

    if (this.props.onBeforeInsert) {

      const filteredItems = this.props.onBeforeInsert(selectedItems)

      if (filteredItems && (filteredItems instanceof Array)) {
        this.props.onInsert && this.props.onInsert(filteredItems)
      } else if (filteredItems !== false) {
        this.props.onInsert && this.props.onInsert(selectedItems)
      }

    } else {
      this.props.onInsert && this.props.onInsert(selectedItems)
    }

  }

}