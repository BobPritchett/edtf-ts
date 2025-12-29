import DefaultTheme from 'vitepress/theme';
import EDTFPlayground from '../components/EDTFPlayground.vue';
import './custom.css';

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('EDTFPlayground', EDTFPlayground);
  }
};
