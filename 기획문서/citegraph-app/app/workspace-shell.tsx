/* eslint-disable @next/next/no-html-link-for-pages */
"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import "./workspace.css";

export interface ProjectItem {
  id: string;
  name: string;
  domainLabel: string;
}

export interface ScanItem {
  id: string;
  finalUrl: string;
  createdAt: string;
}

interface WorkspaceContextType {
  projects: ProjectItem[];
  projectId: string;
  setProjectId: (id: string) => void;
  activeProject: ProjectItem | null;
  scans: ScanItem[];
  setScans: React.Dispatch<React.SetStateAction<ScanItem[]>>;
  refreshScans: (targetProjectId?: string) => Promise<void>;
  refreshProjects: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | null>(null);

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used within a WorkspaceShell");
  }
  return context;
}

export interface WorkspaceShellProps {
  currentPage: "audit" | "compare";
  children: React.ReactNode;
}

export function WorkspaceShell({ currentPage, children }: WorkspaceShellProps) {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [projectId, setProjectId] = useState("");
  const [projectName, setProjectName] = useState("");
  const [projectDomain, setProjectDomain] = useState("example.com");
  const [projectError, setProjectError] = useState("");
  const [scans, setScans] = useState<ScanItem[]>([]);
  const [newProjectOpen, setNewProjectOpen] = useState(false);

  const refreshProjects = useCallback(async () => {
    try {
      const response = await fetch("/api/projects");
      const body = (await response.json()) as { items?: ProjectItem[] };
      if (body.items) {
        setProjects(body.items);
        if (!projectId && body.items[0]) {
          setProjectId(body.items[0].id);
        }
      }
    } catch {
      // Ignore fetch error
    }
  }, [projectId]);

  const refreshScans = useCallback(
    async (targetProjectId?: string) => {
      const targetId = targetProjectId || projectId;
      if (!targetId) {
        setScans([]);
        return;
      }
      try {
        const response = await fetch(`/api/projects/${targetId}/scans`);
        const body = (await response.json()) as { items?: ScanItem[] };
        setScans(body.items || []);
      } catch {
        setScans([]);
      }
    },
    [projectId],
  );

  useEffect(() => {
    void fetch("/api/projects")
      .then((res) => res.json() as Promise<{ items?: ProjectItem[] }>)
      .then((body) => {
        if (body.items) {
          setProjects(body.items);
          if (body.items[0]) {
            setProjectId(body.items[0].id);
          }
        }
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!projectId) {
      return;
    }
    void fetch(`/api/projects/${projectId}/scans`)
      .then((res) => res.json() as Promise<{ items?: ScanItem[] }>)
      .then((body) => setScans(body.items || []))
      .catch(() => setScans([]));
  }, [projectId]);

  async function addProject(event: React.FormEvent) {
    event.preventDefault();
    setProjectError("");
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: projectName, domain: projectDomain }),
      });
      const body = (await response.json()) as {
        item?: ProjectItem;
        error?: string;
      };
      if (!response.ok || !body.item) {
        setProjectError(body.error || "프로젝트를 만들 수 없습니다.");
        return;
      }
      setProjects((items) => [body.item!, ...items]);
      setProjectId(body.item.id);
      setProjectName("");
      setNewProjectOpen(false);
    } catch {
      setProjectError("프로젝트 생성 중 오류가 발생했습니다.");
    }
  }

  const activeProject =
    projects.find((project) => project.id === projectId) || null;

  return (
    <WorkspaceContext.Provider
      value={{
        projects,
        projectId,
        setProjectId,
        activeProject,
        scans,
        setScans,
        refreshScans,
        refreshProjects,
      }}
    >
      <main className="app-shell">
        <header className="app-header">
          <div className="brand">
            <i aria-hidden="true">CG</i>
            <strong>CiteGraph</strong>
          </div>
          <nav aria-label="현재 위치">
            <span>Workspace</span>
            <strong>
              {currentPage === "compare"
                ? "Site Compare"
                : activeProject?.name || "URL Audit"}
            </strong>
          </nav>
          <div className="mode">
            <i aria-hidden="true" />
            Local workspace · 2026.08.1
          </div>
        </header>

        <div className="workspace-layout">
          <aside
            className="project-sidebar"
            aria-labelledby="workspace-heading"
          >
            <nav className="primary-nav" aria-label="제품 메뉴">
              <a
                href="/"
                aria-current={currentPage === "audit" ? "page" : undefined}
              >
                URL Audit
              </a>
              <a
                href="/compare"
                aria-current={currentPage === "compare" ? "page" : undefined}
              >
                Site Compare
              </a>
            </nav>

            <div className="sidebar-heading">
              <p className="section-kicker">LOCAL WORKSPACE</p>
              <h2 id="workspace-heading">Projects</h2>
              <p>식별자 기반 로컬 구획이며 로그인 계정은 아닙니다.</p>
            </div>

            <div className="project-list" aria-label="프로젝트 목록">
              {projects.length === 0 && (
                <p className="empty-projects">아직 프로젝트가 없습니다.</p>
              )}
              {projects.map((project) => (
                <button
                  key={project.id}
                  className={project.id === projectId ? "active" : ""}
                  onClick={() => setProjectId(project.id)}
                >
                  <strong>{project.name}</strong>
                  <span>{project.domainLabel}</span>
                </button>
              ))}
            </div>

            <details
              className="new-project"
              open={newProjectOpen}
              onToggle={(event) => setNewProjectOpen(event.currentTarget.open)}
            >
              <summary>+ 새 프로젝트</summary>
              <form onSubmit={addProject} className="project-form">
                <input
                  aria-label="프로젝트 이름"
                  required
                  maxLength={80}
                  placeholder="프로젝트 이름"
                  value={projectName}
                  onChange={(event) => setProjectName(event.target.value)}
                />
                <input
                  aria-label="도메인 라벨"
                  required
                  placeholder="example.com"
                  value={projectDomain}
                  onChange={(event) => setProjectDomain(event.target.value)}
                />
                <button>프로젝트 추가</button>
              </form>
              {projectError && (
                <p className="sidebar-error">{projectError}</p>
              )}
            </details>

            {activeProject && (
              <section
                className="recent-scans"
                aria-label="최근 저장 결과"
              >
                <div>
                  <strong>Recent scans</strong>
                  <span>{scans.length}</span>
                </div>
                {scans.slice(0, 5).map((scan) => (
                  <p key={scan.id}>
                    <span>{scan.finalUrl}</span>
                    <time>
                      {new Date(scan.createdAt).toLocaleDateString("ko-KR")}
                    </time>
                  </p>
                ))}
              </section>
            )}
          </aside>

          {children}
        </div>
      </main>
    </WorkspaceContext.Provider>
  );
}
