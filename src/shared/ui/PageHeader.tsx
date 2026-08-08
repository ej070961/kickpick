type PageHeaderProps = {
  title: string;
  description: string;
};

/**
 * 페이지 상단의 제목과 보조 설명을 일관된 간격으로 렌더링합니다.
 */
export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className="mb-8">
      <p className="text-primary mb-4 text-sm font-bold">KickPick</p>
      <h2 className="text-foreground text-3xl font-bold tracking-normal md:text-4xl">
        {title}
      </h2>
      <p className="text-muted mt-4 max-w-2xl text-base leading-7">
        {description}
      </p>
    </div>
  );
}
