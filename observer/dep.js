

let uid = 0;


export default class Depend{
    constructor(){
        this.id = uid++;
        this.subs = [];
    }
    depend(){
        if(window.target){
            window.target.addDep(this)
        }
    }
    addSub(sub){
        this.subs.push(sub)
    }
    removeSub(sub){
        let index = this.subs.indexOf(sub);
        if(index >= 0){
            this.subs.splice(index,1)
        }
    }
    notify(){
        const subs = this.subs.slice();
        subs.forEach(item=>item.update());
    }

}