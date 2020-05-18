/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { isAny } from 'dmn-js-shared/lib/util/ModelUtil';

import { getBBox } from 'diagram-js/lib/util/Elements';

const CURRENT_OPEN_DRG_ELEMENT_MARKER = 'open';


export default class OpenDrgElement {
  constructor(canvas, elementRegistry, eventBus) {
    this._canvas = canvas;

    let currentOpenDrgElementId;

    eventBus.on('import.done', () => {
      if (currentOpenDrgElementId) {
        const currentOpenDrgElement = elementRegistry.get(currentOpenDrgElementId);

        if (currentOpenDrgElement) {
          canvas.addMarker(currentOpenDrgElement, CURRENT_OPEN_DRG_ELEMENT_MARKER);
        }
      }
    });

    // highlight open DRG element and optionally center viewbox around it
    eventBus.on('drgElementOpened', ({ centerViewbox, id }) => {
      let currentOpenDrgElement;

      // (1) remove hightlight from previously open DRG element
      if (currentOpenDrgElementId) {
        currentOpenDrgElement = elementRegistry.get(currentOpenDrgElementId);

        if (currentOpenDrgElement) {
          canvas.removeMarker(currentOpenDrgElement, CURRENT_OPEN_DRG_ELEMENT_MARKER);
        }
      }

      currentOpenDrgElementId = id;

      currentOpenDrgElement = elementRegistry.get(currentOpenDrgElementId);

      // (2) add highligh to open DRG element
      if (currentOpenDrgElement) {
        canvas.addMarker(currentOpenDrgElement, CURRENT_OPEN_DRG_ELEMENT_MARKER);

        if (centerViewbox) {

          // (3) center viewbox around it once overview is open
          eventBus.once('attachOverview', () => {
            this.centerViewbox(currentOpenDrgElement);
          });
        }
      }
    });

    // open DRG element on click
    eventBus.on('element.click', ({ element }) => {
      if (!this.canOpenDrgElement(element)) {
        return;
      }

      const { id } = element;

      eventBus.fire('openDrgElement', {
        id
      });
    });
  }

  canOpenDrgElement = (element) => {
    const { businessObject } = element;

    const hasDecisionLogic = !!businessObject.decisionLogic;

    return isAny(element, [ 'dmn:Decision', 'dmn:LiteralExpression' ]) && hasDecisionLogic;
  }

  centerViewbox = (element) => {
    var viewbox = this._canvas.viewbox();

    var box = getBBox(element);

    var newViewbox = {
      x: (box.x + box.width / 2) - viewbox.outer.width / 2,
      y: (box.y + box.height / 2) - viewbox.outer.height / 2,
      width: viewbox.outer.width,
      height: viewbox.outer.height
    };

    this._canvas.viewbox(newViewbox);

    this._canvas.zoom(viewbox.scale);
  }
}

OpenDrgElement.$inject = [
  'canvas',
  'elementRegistry',
  'eventBus'
];