/**
 * @version        1.1
 * @source         https://learn.javascript.ru/drag-and-drop-objects
 * @modifications  Artem Kuznecov, web.master-artem.ru
 * @email          work.artem.kuznecov.samara@yandex.ru
 * @polyfill       https://cdn.polyfill.io/v1/polyfill.js?features=Element.prototype.closest
 * @param {String} draggableSelector 
 * @param {String} wrapperSelector default=body
 **/
function DragManager(draggableSelector, wrapperSelector=false) {
  /**
   * составной объект для хранения информации о переносе:
   * {
   *   elem - элемент, на котором была зажата мышь
   *   object - переносимый объект
   *   downX/downY - координаты, на которых был mousedown
   *   shiftX/shiftY - относительный сдвиг курсора от угла элемента
   * }
   */
  var dragObject = {};

  var self = this;

  function onMouseDown(e) {

    if (e.which != 1) return;

    var elem = e.target.closest(draggableSelector);
    if (!elem) return;

    dragObject.elem = elem;

    // запомним, что элемент нажат на текущих координатах pageX/pageY
    dragObject.downX = e.pageX;
    dragObject.downY = e.pageY;

    return false;
  }

  function onMouseMove(e) {
    if (!dragObject.elem) return; // элемент не зажат

    if (!dragObject.object) { // если перенос не начат...
      var moveX = e.pageX - dragObject.downX;
      var moveY = e.pageY - dragObject.downY;

      // если мышь передвинулась в нажатом состоянии недостаточно далеко
      if (Math.abs(moveX) < 3 && Math.abs(moveY) < 3) {
        return;
      }

      // начинаем перенос
      dragObject.object = createObject(e); // создать объект переноса
      if (!dragObject.object) { // отмена переноса, нельзя "захватить" за эту часть элемента
        dragObject = {};
        return;
      }

      // объект переноса создан успешно
      // создать вспомогательные свойства shiftX/shiftY
      var coords = getCoords(dragObject.object);
      dragObject.shiftX = dragObject.downX - coords.left;
      dragObject.shiftY = dragObject.downY - coords.top;

      startDrag(e); // отобразить начало переноса
    }

    // отобразить перенос объекта при каждом движении мыши
    dragObject.object.style.left = e.pageX - dragObject.shiftX + 'px';
    dragObject.object.style.top = e.pageY - dragObject.shiftY + 'px';

    return false;
  }

  function onMouseUp(e) {
    if (dragObject.object) { // если перенос идет
      finishDrag(e);
    }

    // перенос либо не начинался, либо завершился
    // в любом случае очистим "состояние переноса" dragObject
    dragObject = {};
  }

  function finishDrag(e) {
    var dropElem = findDroppable(e);

    if (!dropElem) {
      self.onDragCancel(dragObject);
    } else {
      self.onDragEnd(dragObject, dropElem);
    }
  }

  function createObject(e) {

    // запомнить старые свойства, чтобы вернуться к ним при отмене переноса
    var object = dragObject.elem;
    var old = {
      parent: object.parentNode,
      nextSibling: object.nextSibling,
      position: object.position || '',
      left: object.left || '',
      top: object.top || '',
      zIndex: object.zIndex || ''
    };

    // функция для отмены переноса
    object.rollback = function () {
      old.parent.insertBefore(object, old.nextSibling);
      object.style.position = old.position;
      object.style.left = old.left;
      object.style.top = old.top;
      object.style.zIndex = old.zIndex
    };

    return object;
  }

  function startDrag(e) {
    var object = dragObject.object;

    // инициировать начало переноса
    if (wrapperSelector) {
      let wrapper = document.querySelector(wrapperSelector);
      wrapper.append(object);
    } else {
      document.body.append(object);
    }
    object.style.zIndex = 9999;
    object.style.position = 'absolute';
  }

  function findDroppable(event) {
    // спрячем переносимый элемент
    dragObject.object.hidden = true;

    // получить самый вложенный элемент под курсором мыши
    var elem = document.elementFromPoint(event.clientX, event.clientY);

    // показать переносимый элемент обратно
    dragObject.object.hidden = false;

    if (elem == null) {
      // такое возможно, если курсор мыши "вылетел" за границу окна
      return null;
    }

    return elem.closest('.droppable');
  }

  document.onmousemove = onMouseMove;
  document.onmouseup = onMouseUp;
  document.onmousedown = onMouseDown;

  this.onDragEnd = function (dragObject, dropElem) { };
  this.onDragCancel = function (dragObject) { };


  
  function getCoords(elem) { // кроме IE8-
    var box = elem.getBoundingClientRect();
  
    return {
      top: box.top + pageYOffset,
      left: box.left + pageXOffset
    };
  
  }
  
}