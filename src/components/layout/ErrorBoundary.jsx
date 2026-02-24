import { Component } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.jsx";
import { Button } from "@/components/ui/button.jsx";

// eslint-disable-next-line react-refresh/only-export-components
function ErrorFallback() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-[50vh] items-center justify-center p-8">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="text-center">{t("errors.boundaryTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <p className="text-sm text-muted-foreground text-center">
            {t("errors.boundaryMessage")}
          </p>
          <Button onClick={() => window.location.reload()}>
            {t("errors.boundaryRefresh")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * React error boundary to catch uncaught rendering errors.
 * Shows a friendly error message with retry option.
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }

    return this.props.children;
  }
}
