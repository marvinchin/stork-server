import expressValidator from 'express-validator';

const validator = () => expressValidator({
  customValidators: {
    noSpaces: (str) => {
      return !(/\s/.test(str));
    },
    validGender: (str) => {
      return str === 'Male' || str === 'Female';
    },
    notEmpty: (str) => {
      return str && str !== '';
    },
  },
});


export default validator;
