import{h}from"../aleph.core.js";var AlConsole=function(){function e(){}return e.prototype.render=function(){var e=this;return h("form",{onSubmit:function(e){return e.preventDefault()}},h("ion-item",null,h("ion-textarea",{value:this.cmd,rows:"10",required:!0,onIonChange:function(n){return e.cmd=n.detail.value},ref:function(n){return e._cmd=n}})),h("ion-button",{size:"small",type:"submit",onClick:function(){e.cmd&&e.command.emit(e._cmd.value)}},h("ion-icon",{name:"arrow-dropright"})))},Object.defineProperty(e,"is",{get:function(){return"al-console"},enumerable:!0,configurable:!0}),Object.defineProperty(e,"encapsulation",{get:function(){return"shadow"},enumerable:!0,configurable:!0}),Object.defineProperty(e,"properties",{get:function(){return{cmd:{type:String,attr:"cmd",mutable:!0}}},enumerable:!0,configurable:!0}),Object.defineProperty(e,"events",{get:function(){return[{name:"command",method:"command",bubbles:!0,cancelable:!0,composed:!0}]},enumerable:!0,configurable:!0}),Object.defineProperty(e,"style",{get:function(){return""},enumerable:!0,configurable:!0}),e}();export{AlConsole};