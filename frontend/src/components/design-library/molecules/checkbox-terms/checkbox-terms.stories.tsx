import React from 'react';
import CheckboxTerms from './checkbox-terms';

export default {
  title: 'Design Library/Molecules/CheckboxTerms',
  component: CheckboxTerms,
};

const Template = (args) => <CheckboxTerms {...args} />;

export const Default = Template.bind({});
Default.args = {
  onchange: () => {},
  onAccept: () => {},
};