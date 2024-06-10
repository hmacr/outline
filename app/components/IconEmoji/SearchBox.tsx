import React from "react";
import styled from "styled-components";
import InputSearch from "../InputSearch";

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
};

const SearchBox = ({ value, onChange, placeholder }: Props) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value.toLowerCase());
  };

  return (
    <StyledInputSearch
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
    />
  );
};

const StyledInputSearch = styled(InputSearch)``;

export default SearchBox;
