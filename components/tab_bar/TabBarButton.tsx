import { Feather } from "@expo/vector-icons";
import { useEffect } from "react";
import { Pressable, StyleSheet } from "react-native";
import 'react-native-reanimated';
import Animated, {
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from "react-native-reanimated";

export function TabBarButton({
    routerName,
    onPress,
    onLongPress,
    isFocused,
    label,
    color,
}: {
    routerName: string;
    onPress: () => void;
    onLongPress?: () => void;
    isFocused: boolean;
    label: string;
    color: string;
}) {
    const scale = useSharedValue(0);

    useEffect(() => {
        scale.value = withSpring(isFocused ? 1 : 0, { duration: 350 });
    }, [isFocused, scale]);

    const animatedTextStyle = useAnimatedStyle(() => ({
        opacity: interpolate(scale.value, [0, 1], [1, 0]),
    }));

    const animatedViewStyle = useAnimatedStyle(() => ({
        transform: [{ scale: interpolate(scale.value, [0, 1], [1, 1.3]) }],
        top: interpolate(scale.value, [0, 1], [0, 9]),
    }));

    const icons = {
        index: (props?: any) => <Feather name="home" size={24} {...props} />,
        tools: (props?: any) => <Feather name="tool" size={24} {...props} />,
        setting: (props?: any) => <Feather name="pen-tool" size={24} {...props} />,
    };

    const AnimatedPressable = Animated.createAnimatedComponent(Pressable);


    return (
        <AnimatedPressable
            onPress={onPress}
            // onLongPress={onLongPress}
            style={styles.tabbarItem}
        >
            <Animated.View style={animatedViewStyle}>
                {icons[routerName]({ color })}
            </Animated.View>

            <Animated.Text style={[{ color }, animatedTextStyle]}>{label}</Animated.Text>
        </AnimatedPressable>
    );
}

const styles = StyleSheet.create({
    tabbarItem: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 50, // Makes it circular
        overflow: 'hidden', // Prevents ripple from going outside
    }
});