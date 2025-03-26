import { View, StyleSheet, LayoutChangeEvent, Animated } from "react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { MD3DarkTheme, useTheme } from "react-native-paper";
import { TabBarButton } from "./TabBarButton";
import { useState, useEffect, useRef } from "react";
const { colors } = MD3DarkTheme;

export function MyTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const [dimensions, setDimensions] = useState({ width: 20, height: 100 });
  const buttonWidth = state.routes.length > 0 ? dimensions.width / state.routes.length : 0;
  const theme = useTheme()

  const onTabbarLayout = (e: LayoutChangeEvent) => {
    setDimensions({
      height: e.nativeEvent.layout.height,
      width: e.nativeEvent.layout.width,
    });
  };

  // Animated value for background movement
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (dimensions.width > 20 && buttonWidth > 0) {
      const newPosition = state.index * buttonWidth;
      
      Animated.timing(animatedValue, {
        toValue: newPosition,
        duration: 250, // Faster response
        useNativeDriver: true, // Optimize performance
      }).start();
    }
  }, [state.index, dimensions.width]);

  return (
    <View onLayout={onTabbarLayout} style={styles.tabbar}>
      {/* Background Indicator (RED MOVING VIEW) */}
      <Animated.View
        style={[
          styles.backgroundIndicator,
          {backgroundColor:theme.colors.primary},
          { width: buttonWidth - 20, height: dimensions.height - 20 }, // Adjusted for better fit
          { transform: [{ translateX: animatedValue }] },
        ]}
      />

      {/* Tabs */}
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        const label = options.tabBarLabel ?? options.title ?? route.name;

        const onPress = () => {
          navigation.navigate(route.name);
        };

        return (
          <TabBarButton
            key={route.name}
            routerName={route.name}
            onPress={onPress}
            isFocused={isFocused}
            label={label as string}
            color={isFocused ? '#fff' : colors.scrim}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabbar: {
    flexDirection: "row",
    position: "absolute",
    bottom: 30,
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 50, // Adjusted margin
    paddingVertical: 15,
    borderRadius: 35,
    elevation: 10,
    shadowColor: "#333",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  backgroundIndicator: {
    position: "absolute",
    borderRadius: 30,
    marginHorizontal: 10, // Center alignment fix
  },
});
