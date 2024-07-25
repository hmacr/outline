import React from "react";
import { useTranslation } from "react-i18next";
import Button from "~/components/Button";
import { authUrl } from "../../shared/url";

type Props = {
  state: string;
  scopes: string[];
  label?: string;
  icon?: React.ReactNode;
};

const ConnectButton = ({ state = "", scopes, label, icon }: Props) => {
  const { t } = useTranslation();

  const handleClick = () => {
    window.location.href = authUrl({ state, scope: scopes.join(" ") });
  };

  return (
    <Button onClick={handleClick} icon={icon} neutral>
      {label || t("Add to Mattermost")}
    </Button>
  );
};

export default ConnectButton;
