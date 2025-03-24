import { Children, ReactElement } from "react"
import { View } from "react-native"

export default ({
    onPress,
    color,
    children
}:{
    onPress:()=> void,
    color:string,
    children:ReactElement<View>
})=>{
    const singleChild = Children.only(children);
    return singleChild;
}